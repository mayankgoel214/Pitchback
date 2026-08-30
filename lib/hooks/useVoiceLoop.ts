'use client';

import { useCallback, useRef, useState } from 'react';
import type { BuyerState } from '@/lib/sim/buyer-state';

/**
 * The full voice round trip: microphone in, buyer's voice out.
 *
 * Latency is measured across a boundary that is stated rather than
 * flattering: the clock starts the instant recording stops and ends when
 * the buyer's audio has downloaded and is ready to play. It therefore
 * includes Whisper, the buyer model, TTS, and every network hop between
 * them. It excludes how long the user chose to speak, and it excludes
 * playback duration, because neither is the system's to control.
 */

export type LoopPhase =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'thinking'
  | 'speaking'
  | 'error';

export interface Exchange {
  rep: string;
  buyer: string;
  state: BuyerState;
  trigger: string;
  constrained: boolean;
  /** Round-trip milliseconds for this exchange. */
  latencyMs: number;
}

export interface VoiceLoopState {
  phase: LoopPhase;
  error: string | null;
  exchanges: Exchange[];
  state: BuyerState | null;
  turnsUsed: number;
  turnsAllowed: number;
  ended: 'committed' | 'hung_up' | null;
}

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

/** Extension Whisper will accept for a given recorder mime type. */
function extensionFor(mime: string): string {
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('ogg')) return 'ogg';
  return 'webm';
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.message || body?.error || `Request failed (${res.status}).`;
  } catch {
    return `Request failed (${res.status}).`;
  }
}

export function useVoiceLoop(runId: string | null, scenarioId: string) {
  const [phase, setPhase] = useState<LoopPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [state, setState] = useState<BuyerState | null>(null);
  const [turnsUsed, setTurnsUsed] = useState(0);
  const [turnsAllowed, setTurnsAllowed] = useState(12);
  const [ended, setEnded] = useState<'committed' | 'hung_up' | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /** Play an mp3 blob and resolve when it finishes. */
  const play = useCallback(async (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    try {
      await audio.play();
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
      });
    } finally {
      URL.revokeObjectURL(url);
      audioRef.current = null;
    }
  }, []);

  /** Fetch the buyer's line as audio. Part of the measured round trip. */
  const fetchSpeech = useCallback(
    async (text: string): Promise<Blob | null> => {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, scenarioId }),
      });
      if (!res.ok) {
        // The conversation can continue without audio, but the user is told
        // the voice failed rather than left wondering why it went quiet.
        setError(await readError(res));
        return null;
      }
      return res.blob();
    },
    [scenarioId],
  );

  const speakOpening = useCallback(
    async (text: string) => {
      setPhase('speaking');
      const blob = await fetchSpeech(text);
      if (blob) await play(blob);
      setPhase('idle');
    },
    [fetchSpeech, play],
  );

  /**
   * Send a turn as text instead of speech.
   *
   * Not a debug hatch — plenty of people cannot use a microphone, or are
   * sitting somewhere they cannot talk out loud, and the exercise still
   * works for them. Latency is deliberately not sampled here, because this
   * path skips speech-to-text and would flatter the numbers on the results
   * page.
   */
  const sendText = useCallback(
    async (text: string) => {
      if (!runId || !text.trim()) return;
      setError(null);
      setPhase('thinking');

      try {
        const turnRes = await fetch(`/api/run/${runId}/turn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.trim() }),
        });
        if (!turnRes.ok) {
          setPhase('error');
          setError(await readError(turnRes));
          return;
        }
        const turn = await turnRes.json();

        setExchanges((prev) => [
          ...prev,
          {
            rep: text.trim(),
            buyer: turn.reply,
            state: turn.state,
            trigger: turn.transition.trigger,
            constrained: turn.transition.constrained,
            latencyMs: 0,
          },
        ]);
        setState(turn.state);
        setTurnsUsed(turn.turnsUsed);
        setTurnsAllowed(turn.turnsAllowed);
        setEnded(turn.ended ?? null);

        const speech = await fetchSpeech(turn.reply);
        if (speech) {
          setPhase('speaking');
          await play(speech);
        }
        setPhase('idle');
      } catch (e) {
        setPhase('error');
        setError(e instanceof Error ? e.message : 'Something went wrong on that turn.');
      }
    },
    [runId, fetchSpeech, play],
  );

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      recorderRef.current = recorder;
      setPhase('recording');
    } catch (e) {
      setPhase('error');

      // Only the permission case gets a friendly rewrite, because it is the
      // one a visitor can actually fix. Everything else reports what the
      // browser said — collapsing them all into "your browser may not
      // support it" is a guess, and it hides the cause from the person best
      // placed to act on it.
      if (e instanceof DOMException && e.name === 'NotAllowedError') {
        setError('Microphone access was blocked. Allow it in your browser and reload.');
      } else if (e instanceof DOMException && e.name === 'NotFoundError') {
        setError('No microphone was found. Plug one in, or use "Type instead".');
      } else {
        const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
        setError(`Could not start recording — ${detail}`);
        console.error('startRecording failed', e);
      }
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    if (!runId) {
      setPhase('error');
      setError('This run has not started yet.');
      return;
    }

    const mimeType = recorder.mimeType || 'audio/webm';

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: mimeType }));
      recorder.stop();
    });

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;

    // --- the measured window starts here ---
    const startedAt = performance.now();

    try {
      setPhase('transcribing');
      const form = new FormData();
      form.append('audio', blob, `turn.${extensionFor(mimeType)}`);

      const sttRes = await fetch('/api/transcribe', { method: 'POST', body: form });
      if (!sttRes.ok) {
        setPhase('error');
        setError(await readError(sttRes));
        return;
      }
      const { text } = (await sttRes.json()) as { text: string };

      setPhase('thinking');
      const turnRes = await fetch(`/api/run/${runId}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!turnRes.ok) {
        setPhase('error');
        setError(await readError(turnRes));
        return;
      }
      const turn = await turnRes.json();

      const speech = await fetchSpeech(turn.reply);
      // --- the measured window ends here: audio is in hand ---
      const latencyMs = Math.round(performance.now() - startedAt);

      setExchanges((prev) => [
        ...prev,
        {
          rep: text,
          buyer: turn.reply,
          state: turn.state,
          trigger: turn.transition.trigger,
          constrained: turn.transition.constrained,
          latencyMs,
        },
      ]);
      setState(turn.state);
      setTurnsUsed(turn.turnsUsed);
      setTurnsAllowed(turn.turnsAllowed);
      setEnded(turn.ended ?? null);

      // Reported separately from the turn that produced it so a slow
      // network on this request cannot inflate the sample it is reporting.
      fetch(`/api/run/${runId}/turn/latency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latencyMs }),
      }).catch(() => {});

      if (speech) {
        setPhase('speaking');
        await play(speech);
      }
      setPhase('idle');
    } catch (e) {
      setPhase('error');
      setError(e instanceof Error ? e.message : 'Something went wrong on that turn.');
    }
  }, [runId, fetchSpeech, play]);

  const loop: VoiceLoopState = {
    phase,
    error,
    exchanges,
    state,
    turnsUsed,
    turnsAllowed,
    ended,
  };

  return { ...loop, startRecording, stopRecording, sendText, speakOpening, setError };
}

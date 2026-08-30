'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Scenario } from '@/data/scenarios';
import type { BuyerState } from '@/lib/sim/buyer-state';
import { useVoiceLoop, type LoopPhase } from '@/lib/hooks/useVoiceLoop';
import { StateLadder, StatePill } from '@/components/StateLadder';

const PHASE_LABEL: Record<LoopPhase, string> = {
  idle: 'Ready',
  recording: 'Listening',
  transcribing: 'Transcribing',
  thinking: 'Buyer is thinking',
  speaking: 'Buyer is speaking',
  error: 'Stopped',
};

export function CallSurface({ scenario }: { scenario: Scenario }) {
  const router = useRouter();
  const [runId, setRunId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [openingLine, setOpeningLine] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');

  const loop = useVoiceLoop(runId, scenario.id);
  const feedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const state: BuyerState = loop.state ?? scenario.openingState;
  const busy = loop.phase !== 'idle' && loop.phase !== 'error';
  const outOfTurns = loop.turnsUsed >= loop.turnsAllowed;
  const finished = Boolean(loop.ended) || outOfTurns;

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [loop.exchanges.length, loop.phase]);

  // The input is disabled while the buyer answers, which drops focus. Without
  // putting it back, every turn after the first needs a fresh click before
  // Enter does anything.
  useEffect(() => {
    if (typing && !busy) inputRef.current?.focus();
  }, [typing, busy, loop.exchanges.length]);

  async function start() {
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: scenario.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? 'Could not start the call.');
      }
      const data = await res.json();
      setRunId(data.runId);
      setOpeningLine(data.openingLine);
      await loop.speakOpening(data.openingLine);
    } catch (e) {
      setStartError(e instanceof Error ? e.message : 'Could not start the call.');
    } finally {
      setStarting(false);
    }
  }

  async function endCall() {
    if (!runId) return;
    setEnding(true);
    try {
      const res = await fetch(`/api/run/${runId}/grade`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        loop.setError(body?.message ?? 'Could not grade this run.');
        setEnding(false);
        return;
      }
      router.push(`/run/${runId}`);
    } catch {
      loop.setError('Could not reach the grader.');
      setEnding(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_18rem]">
      {/* --- the call itself --- */}
      <section className="flex min-h-[22rem] flex-col sm:min-h-[32rem]">
        <div className="flex items-baseline justify-between gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">{scenario.buyer.name}</h1>
            <p className="text-sm text-muted-foreground">
              {scenario.buyer.role}, {scenario.buyer.company}
            </p>
          </div>
          <StatePill state={state} />
        </div>

        <div
          ref={feedRef}
          className="flex-1 space-y-6 overflow-y-auto py-8"
          aria-live="polite"
          aria-label="Call transcript"
        >
          {!runId && (
            <p className="max-w-lg leading-relaxed text-muted-foreground">
              {scenario.brief}
            </p>
          )}

          {openingLine && (
            <Line who={scenario.buyer.name} text={openingLine} tone="buyer" />
          )}

          {loop.exchanges.map((x, i) => (
            <div key={i} className="space-y-6">
              <Line who="You" text={x.rep} tone="rep" />
              <Line who={scenario.buyer.name} text={x.buyer} tone="buyer" />
              <p className="font-mono text-[11px] text-muted-foreground">
                <span style={{ color: `var(--state-${x.state})` }}>{x.state}</span>
                {' · '}
                {x.trigger}
                {x.constrained && ' · constrained by the state machine'}
                {/* Typed turns skip speech-to-text, so there is no round trip
                    to report. Showing "0 ms" would read as a measurement. */}
                {x.latencyMs > 0 && ` · ${x.latencyMs} ms`}
              </p>
            </div>
          ))}

          {loop.phase === 'thinking' && (
            <p className="font-mono text-sm text-muted-foreground">…</p>
          )}
        </div>

        {/* --- controls --- */}
        <div className="border-t border-border pt-6">
          {loop.error && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {loop.error}
            </p>
          )}
          {startError && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {startError}
            </p>
          )}

          {!runId ? (
            <button
              onClick={start}
              disabled={starting}
              className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {starting ? 'Connecting…' : 'Start the call'}
            </button>
          ) : finished ? (
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={endCall}
                disabled={ending}
                className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {ending ? 'Scoring…' : 'See how you did'}
              </button>
              <span className="text-sm text-muted-foreground">
                {loop.ended === 'committed'
                  ? `${scenario.buyer.name} agreed to a next step.`
                  : loop.ended === 'hung_up'
                    ? `${scenario.buyer.name} hung up.`
                    : 'You have used all your turns.'}
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {typing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const text = draft.trim();
                    if (!text) return;
                    setDraft('');
                    loop.sendText(text);
                  }}
                  className="flex flex-wrap items-center gap-3"
                >
                  <input
                    ref={inputRef}
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    // Implicit form submission on Enter is not reliable here,
                    // so send it explicitly. Enter is what anyone typing a
                    // reply will reach for first.
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter' || e.shiftKey) return;
                      e.preventDefault();
                      const text = draft.trim();
                      if (!text || busy) return;
                      setDraft('');
                      loop.sendText(text);
                    }}
                    disabled={busy}
                    placeholder="Say something to them…"
                    aria-label="Your turn"
                    className="min-w-0 flex-1 rounded-full border border-border bg-card px-5 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={busy || !draft.trim()}
                    className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={() => setTyping(false)}
                    className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    Use the mic
                  </button>
                </form>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onMouseDown={loop.startRecording}
                    onMouseUp={loop.stopRecording}
                    onMouseLeave={() => loop.phase === 'recording' && loop.stopRecording()}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      loop.startRecording();
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      loop.stopRecording();
                    }}
                    disabled={busy && loop.phase !== 'recording'}
                    className={`rounded-full px-8 py-4 text-sm font-medium transition-all disabled:opacity-40 ${
                      loop.phase === 'recording'
                        ? 'bg-destructive text-white'
                        : 'bg-foreground text-background hover:opacity-90'
                    }`}
                  >
                    {loop.phase === 'recording' ? 'Release to send' : 'Hold to talk'}
                  </button>

                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {PHASE_LABEL[loop.phase]}
                  </span>

                  <button
                    type="button"
                    onClick={() => setTyping(true)}
                    className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    Type instead
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[11px] text-muted-foreground">
                  {loop.turnsAllowed - loop.turnsUsed} turns left
                </p>
                <button
                  onClick={endCall}
                  disabled={ending || loop.exchanges.length === 0}
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-40"
                >
                  {ending ? 'Scoring…' : 'End the call'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* --- the readout --- */}
      <aside className="space-y-8 lg:border-l lg:border-border lg:pl-8">
        <div>
          <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Receptivity
          </h2>
          <StateLadder current={state} />
        </div>

        <div>
          <h2 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Turns
          </h2>
          <p className="font-mono text-sm">
            {loop.turnsUsed} <span className="text-muted-foreground">/ {loop.turnsAllowed}</span>
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            What good looks like
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            {scenario.objectives.map((o) => (
              <li key={o} className="flex gap-2">
                <span aria-hidden className="text-muted-foreground/50">
                  —
                </span>
                {o}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/"
          className="inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          All calls
        </Link>
      </aside>
    </div>
  );
}

function Line({ who, text, tone }: { who: string; text: string; tone: 'rep' | 'buyer' }) {
  return (
    <div className={tone === 'rep' ? 'pl-8' : ''}>
      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {who}
      </p>
      <p
        className={`leading-relaxed ${tone === 'rep' ? 'text-muted-foreground' : 'text-foreground'}`}
      >
        {text}
      </p>
    </div>
  );
}

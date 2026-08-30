import OpenAI from 'openai';

/**
 * Models are pinned rather than floating. A silent model swap changes both
 * the latency figures in the README and the behaviour of the grader, and
 * neither should move without a commit.
 */
export const MODELS = {
  /** The buyer's turn. Needs to be fast — it sits in the voice loop. */
  buyer: 'gpt-4o-mini',
  /** End-of-run grading. Off the hot path, so accuracy over speed. */
  grader: 'gpt-4o',
  transcription: 'whisper-1',
  speech: 'tts-1',
} as const;

/** Bounds on anything a visitor can send us, because every call costs money. */
export const LIMITS = {
  /** Longest single audio clip accepted, in bytes (~30s of webm/opus). */
  maxAudioBytes: 1_000_000,
  /** Longest rep turn accepted as text. */
  maxTurnChars: 2_000,
  /** Turns per run before the call is closed out and graded. */
  maxTurns: 12,
  /** Characters per TTS request. */
  maxSpeechChars: 600,
} as const;

let client: OpenAI | null = null;

/**
 * Throws when the key is absent rather than returning a stub. A missing key
 * must fail loudly at the first call, not produce a demo that appears to
 * work and quietly says nothing.
 */
export function openai(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not set. Voice and grading are unavailable; ' +
        'this is a configuration failure, not a degraded mode.',
    );
  }
  // Points at any OpenAI-compatible endpoint. Left configurable so the app
  // can be driven end to end against a stub during development without
  // spending money, and so a compatible proxy or gateway can be swapped in.
  // Unset in production, where it defaults to OpenAI itself.
  const baseURL = process.env.OPENAI_BASE_URL || undefined;

  if (!client) client = new OpenAI({ apiKey, baseURL });
  return client;
}

export function hasKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

import { createHash } from 'crypto';
import { prisma } from '@/lib/db/prisma';

/**
 * Fixed-window rate limiting, backed by Postgres.
 *
 * Deliberately not in-process memory. On Vercel each concurrent instance
 * gets its own heap, so an in-memory counter caps a visitor at N requests
 * *per instance* and the real ceiling is unbounded. Every endpoint limited
 * here spends money on a model call, so the limit has to be shared.
 */

export interface Limit {
  /** Requests permitted per window. */
  max: number;
  /** Window length in seconds. */
  windowSec: number;
}

export const LIMITS: Record<string, Limit> = {
  /** Whisper. The most expensive per call, and the easiest to abuse. */
  transcribe: { max: 40, windowSec: 60 * 10 },
  /** A buyer turn. Bounded further by maxTurns per run. */
  turn: { max: 60, windowSec: 60 * 10 },
  /** TTS. Cached, so uncached misses are what actually cost. */
  speak: { max: 60, windowSec: 60 * 10 },
  /** End-of-run grading, on the larger model. */
  grade: { max: 12, windowSec: 60 * 10 },
};

/**
 * Client identity for limiting. Hashed before storage — the raw IP is never
 * written down, and the hash is useless for anything but bucketing.
 */
export function clientKey(req: Request, endpoint: string): string {
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  const ip = fwd.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  const salt = process.env.RATELIMIT_SALT ?? 'pitchback';
  const hash = createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
  return `${endpoint}:${hash}`;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Seconds until the window resets. */
  resetSec: number;
}

/**
 * Consume one unit. Throws if the store is unreachable — an endpoint that
 * spends money must not serve traffic when its limiter is down.
 */
export async function consume(
  req: Request,
  endpoint: keyof typeof LIMITS,
): Promise<RateLimitResult> {
  const limit = LIMITS[endpoint];
  const key = clientKey(req, endpoint);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + limit.windowSec * 1000);

  const existing = await prisma.rateLimitWindow.findUnique({ where: { key } });

  if (!existing || existing.expiresAt <= now) {
    await prisma.rateLimitWindow.upsert({
      where: { key },
      create: { key, count: 1, expiresAt },
      update: { count: 1, expiresAt },
    });
    return { ok: true, remaining: limit.max - 1, resetSec: limit.windowSec };
  }

  const resetSec = Math.max(
    0,
    Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000),
  );

  if (existing.count >= limit.max) {
    return { ok: false, remaining: 0, resetSec };
  }

  const updated = await prisma.rateLimitWindow.update({
    where: { key },
    data: { count: { increment: 1 } },
  });

  return { ok: true, remaining: Math.max(0, limit.max - updated.count), resetSec };
}

/** 429 with the headers a well-behaved client needs to back off. */
export function tooMany(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'rate_limited',
      message:
        'This demo is rate limited because every call costs real money at the model provider. Try again shortly.',
      retryAfterSec: result.resetSec,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.resetSec),
      },
    },
  );
}

/** Housekeeping. Safe to call from any route; cheap and indexed. */
export async function sweepExpired(): Promise<number> {
  const { count } = await prisma.rateLimitWindow.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  return count;
}

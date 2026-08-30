import { NextResponse } from 'next/server';
import { route } from '@/lib/http';
import { createHash } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { LIMITS as AI_LIMITS, MODELS, openai } from '@/lib/ai/client';
import { voiceFor } from '@/data/scenarios';
import { consume, tooMany } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Text to speech, cached in Postgres.
 *
 * Worth caching because a scenario's opening line is byte-identical on
 * every run — without this, the single most-played line in the product is
 * re-synthesised and re-billed for every visitor who opens the page.
 */
export const POST = route(async (req: Request) => {
  const body = await req.json().catch(() => null);
  const text: unknown = body?.text;
  const scenarioId: unknown = body?.scenarioId;

  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json(
      { error: 'bad_request', message: 'text is required.' },
      { status: 400 },
    );
  }
  if (typeof scenarioId !== 'string') {
    return NextResponse.json(
      { error: 'bad_request', message: 'scenarioId is required.' },
      { status: 400 },
    );
  }

  const input = text.trim().slice(0, AI_LIMITS.maxSpeechChars);
  const voice = voiceFor(scenarioId);
  const key = createHash('sha256')
    .update(`${MODELS.speech}:${voice}:${input}`)
    .digest('hex');

  const cached = await prisma.speechCache.findUnique({ where: { key } });
  if (cached) {
    return new NextResponse(Buffer.from(cached.audio), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(cached.audio.length),
        'X-Cache': 'hit',
      },
    });
  }

  // Only a cache miss costs money, so only a miss is rate limited.
  const limit = await consume(req, 'speak');
  if (!limit.ok) return tooMany(limit);

  const speech = await openai().audio.speech.create({
    model: MODELS.speech,
    voice,
    input,
    speed: 1.0,
  });

  const audio = Buffer.from(await speech.arrayBuffer());

  // A failed cache write must not fail the request — the audio is already
  // paid for and the visitor should hear it. It is logged, not swallowed.
  prisma.speechCache
    .create({ data: { key, audio } })
    .catch((e) => console.error('speech cache write failed', key, e));

  return new NextResponse(audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(audio.length),
      'X-Cache': 'miss',
    },
  });
});

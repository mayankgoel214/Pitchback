import { NextResponse } from 'next/server';
import { route } from '@/lib/http';
import { LIMITS, MODELS, openai } from '@/lib/ai/client';
import { consume, tooMany } from '@/lib/ratelimit';

/**
 * Speech to text. This is the half of the voice loop that did not exist
 * before — `transcribeAudio()` threw `Not implemented`, and no route
 * accepted audio at all.
 */
export const runtime = 'nodejs';
export const maxDuration = 30;

export const POST = route(async (req: Request) => {
  const limit = await consume(req, 'transcribe');
  if (!limit.ok) return tooMany(limit);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'bad_request', message: 'Expected multipart form data with an "audio" field.' },
      { status: 400 },
    );
  }

  const audio = form.get('audio');
  if (!(audio instanceof File)) {
    return NextResponse.json(
      { error: 'bad_request', message: 'Missing "audio" file field.' },
      { status: 400 },
    );
  }

  if (audio.size === 0) {
    return NextResponse.json(
      { error: 'empty_audio', message: 'The recording was empty.' },
      { status: 400 },
    );
  }

  if (audio.size > LIMITS.maxAudioBytes) {
    return NextResponse.json(
      {
        error: 'audio_too_large',
        message: `Recordings are capped at ${Math.round(LIMITS.maxAudioBytes / 1000)} KB (about 30 seconds). Say less, and say it faster — that is the exercise.`,
      },
      { status: 413 },
    );
  }

  const startedAt = Date.now();

  const result = await openai().audio.transcriptions.create({
    file: audio,
    model: MODELS.transcription,
    // The buyer and rep are talking business English; naming the language
    // stops Whisper hunting and measurably cuts the round trip.
    language: 'en',
    response_format: 'json',
  });

  const text = result.text?.trim() ?? '';

  // An empty transcription is a real outcome — the mic picked up nothing.
  // Report it as such rather than passing an empty turn to the buyer.
  if (!text) {
    return NextResponse.json(
      { error: 'no_speech', message: 'Nothing was picked up. Check your microphone and try again.' },
      { status: 422 },
    );
  }

  return NextResponse.json({
    text,
    ms: Date.now() - startedAt,
    remaining: limit.remaining,
  });
});

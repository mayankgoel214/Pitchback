import { NextResponse } from 'next/server';
import { route } from '@/lib/http';
import { prisma } from '@/lib/db/prisma';
import { getScenario } from '@/data/scenarios';
import { buyerTurn } from '@/lib/ai/buyer';
import { callEnds, transition, type BuyerState, type Transition } from '@/lib/sim/buyer-state';
import type { Message } from '@/lib/sim/scoring';
import { LIMITS as AI_LIMITS } from '@/lib/ai/client';
import { consume, tooMany } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const maxDuration = 30;

export const POST = route(async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const limit = await consume(req, 'turn');
  if (!limit.ok) return tooMany(limit);

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const text: unknown = body?.text;

  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json(
      { error: 'bad_request', message: 'text is required.' },
      { status: 400 },
    );
  }

  const run = await prisma.run.findUnique({ where: { id } });
  if (!run) {
    return NextResponse.json({ error: 'not_found', message: 'Unknown run.' }, { status: 404 });
  }
  if (run.completedAt) {
    return NextResponse.json(
      { error: 'run_closed', message: 'This run has already been graded.' },
      { status: 409 },
    );
  }

  const scenario = getScenario(run.scenarioId);
  if (!scenario) {
    return NextResponse.json(
      { error: 'not_found', message: 'The scenario for this run no longer exists.' },
      { status: 404 },
    );
  }

  const transcript = run.transcript as unknown as Message[];
  const history = (run.stateHistory as unknown as Transition[]) ?? [];
  const repTurns = transcript.filter((m) => m.role === 'rep').length;

  if (repTurns >= AI_LIMITS.maxTurns) {
    return NextResponse.json(
      {
        error: 'out_of_turns',
        message: `This run is capped at ${AI_LIMITS.maxTurns} turns. Close it out and see how you did.`,
      },
      { status: 409 },
    );
  }

  const repText = text.trim().slice(0, AI_LIMITS.maxTurnChars);
  const turn = await buyerTurn(scenario, run.state as BuyerState, transcript, repText);
  const t = transition(run.state as BuyerState, turn.signals);

  const nextTranscript: Message[] = [
    ...transcript,
    { role: 'rep', text: repText },
    { role: 'buyer', text: turn.reply },
  ];
  const nextHistory = [...history, t];
  const ended = callEnds(nextHistory);

  await prisma.run.update({
    where: { id },
    data: {
      state: t.to,
      transcript: nextTranscript as never,
      stateHistory: nextHistory as never,
      turns: repTurns + 1,
    },
  });

  return NextResponse.json({
    reply: turn.reply,
    state: t.to,
    transition: { from: t.from, to: t.to, trigger: t.trigger, constrained: t.constrained },
    turnsUsed: repTurns + 1,
    turnsAllowed: AI_LIMITS.maxTurns,
    ended: ended?.reason ?? null,
  });
});

import { NextResponse } from 'next/server';
import { route } from '@/lib/http';
import { prisma } from '@/lib/db/prisma';
import { getScenario } from '@/data/scenarios';
import { judgeNextStep } from '@/lib/ai/grade';
import { callEnds, type BuyerState, type Transition } from '@/lib/sim/buyer-state';
import {
  overall,
  scoreDiscovery,
  scoreNextStep,
  scoreObjectionHandling,
  scoreTalkListen,
  type Competency,
  type Message,
} from '@/lib/sim/scoring';
import { consume, tooMany } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const maxDuration = 45;

export const POST = route(async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const limit = await consume(req, 'grade');
  if (!limit.ok) return tooMany(limit);

  const { id } = await params;
  const run = await prisma.run.findUnique({ where: { id } });
  if (!run) {
    return NextResponse.json({ error: 'not_found', message: 'Unknown run.' }, { status: 404 });
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

  if (!transcript.some((m) => m.role === 'rep')) {
    return NextResponse.json(
      { error: 'nothing_to_grade', message: 'You have not said anything yet.' },
      { status: 400 },
    );
  }

  // Already graded — return the stored result rather than paying for the
  // grader twice on a refresh.
  if (run.completedAt && run.overall !== null) {
    return NextResponse.json(buildResponse(run, transcript, history));
  }

  const judgement = await judgeNextStep(scenario, transcript);

  const competencies: Competency[] = [
    scoreDiscovery(transcript),
    scoreTalkListen(transcript),
    scoreObjectionHandling(history),
    scoreNextStep(judgement),
  ];

  const ended = callEnds(history);
  const outcome = ended?.reason ?? 'out_of_turns';

  const byKey = Object.fromEntries(competencies.map((c) => [c.key, c.score]));

  const updated = await prisma.run.update({
    where: { id },
    data: {
      completedAt: new Date(),
      outcome,
      discovery: byKey.discovery,
      talkListen: byKey.talk_listen,
      objectionHandling: byKey.objection_handling,
      nextStep: byKey.next_step,
      overall: overall(competencies),
      competencies: competencies as never,
    },
  });

  return NextResponse.json({
    ...buildResponse(updated, transcript, history),
    competencies,
  });
});

function buildResponse(
  run: { outcome: string | null; overall: number | null; state: string; latencies: unknown },
  transcript: Message[],
  history: Transition[],
) {
  const latencies = ((run.latencies as number[]) ?? []).slice().sort((a, b) => a - b);
  return {
    outcome: run.outcome,
    overall: run.overall,
    finalState: run.state as BuyerState,
    transcript,
    stateHistory: history,
    latency: latencies.length
      ? {
          samples: latencies.length,
          medianMs: latencies[Math.floor(latencies.length / 2)],
          p95Ms: latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))],
        }
      : null,
  };
}

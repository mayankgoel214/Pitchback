import { NextResponse } from 'next/server';
import { route } from '@/lib/http';
import { prisma } from '@/lib/db/prisma';
import { getScenario } from '@/data/scenarios';
import { sweepExpired } from '@/lib/ratelimit';

export const runtime = 'nodejs';

/** Start a run. No account, no session cookie — just an opaque run id. */
export const POST = route(async (req: Request) => {
  const body = await req.json().catch(() => null);
  const scenarioId = body?.scenarioId;

  if (typeof scenarioId !== 'string') {
    return NextResponse.json(
      { error: 'bad_request', message: 'scenarioId is required.' },
      { status: 400 },
    );
  }

  const scenario = getScenario(scenarioId);
  if (!scenario) {
    return NextResponse.json(
      { error: 'not_found', message: `No scenario with id "${scenarioId}".` },
      { status: 404 },
    );
  }

  // Cheap housekeeping on a cold-ish path rather than a cron.
  sweepExpired().catch((e) => console.error('rate limit sweep failed', e));

  const run = await prisma.run.create({
    data: {
      scenarioId: scenario.id,
      state: scenario.openingState,
      transcript: [{ role: 'buyer', text: scenario.openingLine }],
      stateHistory: [],
    },
  });

  return NextResponse.json({
    runId: run.id,
    state: scenario.openingState,
    openingLine: scenario.openingLine,
  });
});

import { NextResponse } from 'next/server';
import { route } from '@/lib/http';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';

/**
 * Record one round-trip sample.
 *
 * Separate from the turn itself because the sample is only known once the
 * buyer's audio is in hand, which is after the turn response has already
 * been sent. Costs nothing at the model provider, so it is not rate
 * limited, but it is bounded and validated so the stored distribution
 * cannot be stuffed with nonsense.
 */
export const POST = route(async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const latencyMs = Number(body?.latencyMs);

  // A sample outside this range is not a measurement of this system.
  if (!Number.isFinite(latencyMs) || latencyMs <= 0 || latencyMs > 120_000) {
    return NextResponse.json(
      { error: 'bad_request', message: 'latencyMs must be a positive number under 120000.' },
      { status: 400 },
    );
  }

  const run = await prisma.run.findUnique({ where: { id }, select: { latencies: true } });
  if (!run) {
    return NextResponse.json({ error: 'not_found', message: 'Unknown run.' }, { status: 404 });
  }

  const latencies = (run.latencies as unknown as number[]) ?? [];
  if (latencies.length >= 50) {
    return NextResponse.json({ ok: true, samples: latencies.length });
  }

  latencies.push(Math.round(latencyMs));
  await prisma.run.update({ where: { id }, data: { latencies: latencies as never } });

  return NextResponse.json({ ok: true, samples: latencies.length });
});

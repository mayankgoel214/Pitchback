import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Drives the real route handlers against a real Postgres.
 *
 * Only the model provider is mocked. Prisma, the JSON columns, the rate
 * limit windows and the state history all round-trip through the actual
 * database, because a store that cannot round-trip its own types fails
 * only in production — an in-memory double hands back the same object and
 * cannot reproduce a serialisation bug.
 *
 * Requires the local Postgres from the README. Skips loudly rather than
 * silently passing when it is not there.
 */

process.env.DATABASE_URL ??=
  'postgresql://pitchback:pitchback@localhost:55432/pitchback';

const create = vi.fn();

vi.mock('@/lib/ai/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai/client')>('@/lib/ai/client');
  return { ...actual, openai: () => ({ chat: { completions: { create } } }) };
});

const { prisma } = await import('@/lib/db/prisma');
const { POST: createRun } = await import('@/app/api/run/route');
const { POST: takeTurn } = await import('@/app/api/run/[id]/turn/route');
const { POST: gradeRun } = await import('@/app/api/run/[id]/grade/route');
const { POST: recordLatency } = await import('@/app/api/run/[id]/turn/latency/route');

const reachable = await prisma
  .$queryRaw`select 1`
  .then(() => true)
  .catch(() => false);

const withDb = reachable ? describe : describe.skip;
if (!reachable) {
  console.error(
    '\nSKIPPING integration tests: no Postgres at DATABASE_URL.\n' +
      'Start one with:  docker run -d --name pitchback-pg -e POSTGRES_PASSWORD=pitchback ' +
      '-e POSTGRES_USER=pitchback -e POSTGRES_DB=pitchback -p 55432:5432 postgres:16-alpine\n',
  );
}

function post(path: string, body?: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': randomIp() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** A fresh client identity per call, so the limiter never gates the suite. */
let ipCounter = 0;
function randomIp(): string {
  ipCounter += 1;
  return `10.99.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

/** A buyer reply the mocked model will return. */
function buyerSays(reply: string, over: Record<string, unknown> = {}) {
  create.mockResolvedValueOnce({
    choices: [
      { message: { content: JSON.stringify({ reply, direction: 'held', ...over }) } },
    ],
  });
}

beforeEach(async () => {
  create.mockReset();
  if (reachable) await prisma.rateLimitWindow.deleteMany({});
});

afterAll(async () => {
  if (reachable) {
    await prisma.run.deleteMany({ where: { scenarioId: { in: ['pricing', 'discovery'] } } });
    await prisma.rateLimitWindow.deleteMany({});
  }
  await prisma.$disconnect();
});

withDb('a run, end to end, through Postgres', () => {
  it('creates a run seeded with the buyer speaking first', async () => {
    const res = await createRun(post('/api/run', { scenarioId: 'pricing' }), undefined);
    expect(res.status).toBe(200);
    const { runId, state } = await res.json();

    expect(state).toBe('skeptical');

    const row = await prisma.run.findUniqueOrThrow({ where: { id: runId } });
    expect(row.state).toBe('skeptical');
    expect(row.turns).toBe(0);
    expect(row.completedAt).toBeNull();

    // The JSON column must come back as an array of messages, not a string.
    const transcript = row.transcript as unknown as { role: string; text: string }[];
    expect(Array.isArray(transcript)).toBe(true);
    expect(transcript).toHaveLength(1);
    expect(transcript[0].role).toBe('buyer');
  });

  it('advances the state machine and persists the transition with its trigger', async () => {
    const { runId } = await (
      await createRun(post('/api/run', { scenarioId: 'pricing' }), undefined)
    ).json();

    buyerSays('Go on then.', { direction: 'warmed', acknowledged: true });
    const res = await takeTurn(
      post(`/api/run/${runId}/turn`, {
        text: 'That is a fair concern. What is the fifty made up of?',
      }),
      ctx(runId),
    );

    expect(res.status).toBe(200);
    const turn = await res.json();
    expect(turn.state).toBe('neutral');
    expect(turn.turnsUsed).toBe(1);

    const row = await prisma.run.findUniqueOrThrow({ where: { id: runId } });
    const history = row.stateHistory as unknown as { from: string; to: string }[];
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ from: 'skeptical', to: 'neutral' });
    expect(row.state).toBe('neutral');
    expect((row.transcript as unknown as unknown[])).toHaveLength(3);
  });

  it('refuses to warm a skeptical buyer who was talked past, and records why', async () => {
    const { runId } = await (
      await createRun(post('/api/run', { scenarioId: 'pricing' }), undefined)
    ).json();

    buyerSays('Right.', { direction: 'warmed', acknowledged: false });
    const turn = await (
      await takeTurn(
        post(`/api/run/${runId}/turn`, { text: 'We are the market leader. Why not?' }),
        ctx(runId),
      )
    ).json();

    expect(turn.state).toBe('skeptical');
    expect(turn.transition.constrained).toBe(true);
    expect(turn.transition.trigger).toMatch(/acknowledged/);
  });

  it('stores latency samples separately and reports median and p95', async () => {
    const { runId } = await (
      await createRun(post('/api/run', { scenarioId: 'pricing' }), undefined)
    ).json();

    for (const ms of [900, 1500, 1200, 4000, 1100]) {
      const res = await recordLatency(
        post(`/api/run/${runId}/turn/latency`, { latencyMs: ms }),
        ctx(runId),
      );
      expect(res.status).toBe(200);
    }

    const row = await prisma.run.findUniqueOrThrow({ where: { id: runId } });
    expect(row.latencies as unknown as number[]).toHaveLength(5);

    buyerSays('Fine.');
    await takeTurn(post(`/api/run/${runId}/turn`, { text: 'What is the budget?' }), ctx(runId));

    create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({ score: 40, quote: '', note: 'You never proposed one.' }),
          },
        },
      ],
    });
    const graded = await (
      await gradeRun(post(`/api/run/${runId}/grade`), ctx(runId))
    ).json();

    expect(graded.latency.samples).toBe(5);
    expect(graded.latency.medianMs).toBe(1200);
    expect(graded.latency.p95Ms).toBe(4000);
  });

  it('rejects a latency sample that could not be a measurement of this system', async () => {
    const { runId } = await (
      await createRun(post('/api/run', { scenarioId: 'pricing' }), undefined)
    ).json();

    for (const bad of [0, -5, 500_000, 'soon']) {
      const res = await recordLatency(
        post(`/api/run/${runId}/turn/latency`, { latencyMs: bad }),
        ctx(runId),
      );
      expect(res.status).toBe(400);
    }

    const row = await prisma.run.findUniqueOrThrow({ where: { id: runId } });
    expect(row.latencies as unknown as number[]).toHaveLength(0);
  });

  it('grades a finished run and writes every competency back', async () => {
    const { runId } = await (
      await createRun(post('/api/run', { scenarioId: 'discovery' }), undefined)
    ).json();

    buyerSays('About thirty agents.', { direction: 'warmed' });
    await takeTurn(
      post(`/api/run/${runId}/turn`, { text: 'How big is the support team today?' }),
      ctx(runId),
    );

    buyerSays('Maybe four hundred a day.', { direction: 'warmed' });
    await takeTurn(
      post(`/api/run/${runId}/turn`, { text: 'What does the ticket volume look like?' }),
      ctx(runId),
    );

    create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              score: 30,
              quote: '',
              note: 'You never proposed a next step.',
            }),
          },
        },
      ],
    });

    const res = await gradeRun(post(`/api/run/${runId}/grade`), ctx(runId));
    expect(res.status).toBe(200);
    const graded = await res.json();

    expect(graded.competencies).toHaveLength(4);
    expect(graded.competencies.map((c: { key: string }) => c.key).sort()).toEqual([
      'discovery',
      'next_step',
      'objection_handling',
      'talk_listen',
    ]);

    const row = await prisma.run.findUniqueOrThrow({ where: { id: runId } });
    expect(row.completedAt).not.toBeNull();
    expect(row.overall).toBe(graded.overall);
    expect(row.discovery).toBeTypeOf('number');
    expect(row.nextStep).toBe(30);
    expect((row.competencies as unknown as unknown[])).toHaveLength(4);
  });

  it('will not take another turn once the run is graded', async () => {
    const { runId } = await (
      await createRun(post('/api/run', { scenarioId: 'pricing' }), undefined)
    ).json();

    buyerSays('Sure.');
    await takeTurn(post(`/api/run/${runId}/turn`, { text: 'What is the budget?' }), ctx(runId));

    create.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ score: 10, quote: '', note: 'None.' }) } }],
    });
    await gradeRun(post(`/api/run/${runId}/grade`), ctx(runId));

    buyerSays('Hello?');
    const res = await takeTurn(
      post(`/api/run/${runId}/turn`, { text: 'One more thing.' }),
      ctx(runId),
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('run_closed');
  });

  it('does not pay the grader twice for the same run', async () => {
    const { runId } = await (
      await createRun(post('/api/run', { scenarioId: 'pricing' }), undefined)
    ).json();

    buyerSays('Sure.');
    await takeTurn(post(`/api/run/${runId}/turn`, { text: 'What is the budget?' }), ctx(runId));

    create.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ score: 55, quote: '', note: 'Vague.' }) } }],
    });
    await gradeRun(post(`/api/run/${runId}/grade`), ctx(runId));
    const callsAfterFirst = create.mock.calls.length;

    await gradeRun(post(`/api/run/${runId}/grade`), ctx(runId));
    expect(create.mock.calls.length).toBe(callsAfterFirst);
  });

  it('refuses to grade a run in which nobody said anything', async () => {
    const { runId } = await (
      await createRun(post('/api/run', { scenarioId: 'pricing' }), undefined)
    ).json();

    const res = await gradeRun(post(`/api/run/${runId}/grade`), ctx(runId));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('nothing_to_grade');
  });

  it('turns an unusable model response into a 502, scoring nothing', async () => {
    const { runId } = await (
      await createRun(post('/api/run', { scenarioId: 'pricing' }), undefined)
    ).json();

    create.mockResolvedValueOnce({ choices: [{ message: { content: 'not json' } }] });
    const res = await takeTurn(
      post(`/api/run/${runId}/turn`, { text: 'Hello?' }),
      ctx(runId),
    );

    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe('bad_model_response');

    // Nothing was written: a failed turn must not half-advance the run.
    const row = await prisma.run.findUniqueOrThrow({ where: { id: runId } });
    expect(row.turns).toBe(0);
    expect((row.stateHistory as unknown as unknown[])).toHaveLength(0);
  });
});

withDb('the rate limiter, through Postgres', () => {
  it('counts one client and cuts them off at the limit', async () => {
    const ip = '203.0.113.7';
    const call = () =>
      createRun(
        new Request('http://localhost/api/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
          body: JSON.stringify({ scenarioId: 'pricing' }),
        }),
        undefined,
      );

    // /api/run is not itself limited, so drive the limited grade endpoint.
    const grade = () =>
      gradeRun(
        new Request('http://localhost/api/run/nope/grade', {
          method: 'POST',
          headers: { 'x-forwarded-for': ip },
        }),
        ctx('nope'),
      );

    await call();

    const statuses: number[] = [];
    for (let i = 0; i < 14; i++) statuses.push((await grade()).status);

    expect(statuses.filter((s) => s === 429)).toHaveLength(2);
    expect(statuses.slice(0, 12).every((s) => s !== 429)).toBe(true);
  });

  it('never stores the raw client address', async () => {
    const ip = '198.51.100.42';
    await gradeRun(
      new Request('http://localhost/api/run/nope/grade', {
        method: 'POST',
        headers: { 'x-forwarded-for': ip },
      }),
      ctx('nope'),
    );

    const rows = await prisma.rateLimitWindow.findMany({});
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => !r.key.includes(ip))).toBe(true);
  });
});

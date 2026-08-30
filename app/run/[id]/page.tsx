import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getScenario } from '@/data/scenarios';
import type { Competency, Message } from '@/lib/sim/scoring';
import type { Transition, BuyerState } from '@/lib/sim/buyer-state';
import { StatePill, stateColor } from '@/components/StateLadder';

export const dynamic = 'force-dynamic';

const METHOD_LABEL: Record<Competency['method'], string> = {
  computed: 'computed',
  state_machine: 'state machine',
  model_judged: 'model judged',
};

const OUTCOME_LINE: Record<string, string> = {
  committed: 'They agreed to a next step.',
  hung_up: 'They hung up.',
  out_of_turns: 'You ran out of turns.',
};

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await prisma.run.findUnique({ where: { id } });
  if (!run || !run.completedAt) notFound();

  const scenario = getScenario(run.scenarioId);
  const transcript = (run.transcript as unknown as Message[]) ?? [];
  const history = (run.stateHistory as unknown as Transition[]) ?? [];
  const competencies = (run.competencies as unknown as Competency[]) ?? [];
  const latencies = ((run.latencies as unknown as number[]) ?? [])
    .slice()
    .sort((a, b) => a - b);

  const median = latencies.length ? latencies[Math.floor(latencies.length / 2)] : null;
  const p95 = latencies.length
    ? latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))]
    : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 pb-24">
      <header className="border-b border-border pb-8">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          Pitchback
        </Link>
        <h1 className="mt-6 text-3xl font-medium tracking-tight sm:text-4xl">
          {scenario?.title ?? 'Your run'}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <StatePill state={run.state as BuyerState} />
          <span className="text-sm text-muted-foreground">
            {OUTCOME_LINE[run.outcome ?? ''] ?? 'The call ended.'} {run.turns} turns.
          </span>
        </div>
      </header>

      <section className="py-10">
        <div className="flex items-baseline gap-4">
          <p className="font-mono text-6xl tabular-nums">{run.overall}</p>
          <p className="text-sm text-muted-foreground">
            overall, the mean of the four below
          </p>
        </div>

        <dl className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
          {competencies.map((c) => (
            <div key={c.key} className="flex flex-col gap-3 bg-card p-6">
              <dt className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{c.label}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {METHOD_LABEL[c.method]}
                </span>
              </dt>
              <dd>
                <p className="font-mono text-3xl tabular-nums">{c.score}</p>
                <div
                  className="mt-2 h-1 rounded-full bg-muted"
                  role="img"
                  aria-label={`${c.score} out of 100`}
                >
                  <div
                    className="h-1 rounded-full bg-foreground"
                    style={{ width: `${Math.max(0, Math.min(100, c.score))}%` }}
                  />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {c.detail}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {median !== null && (
        <section className="border-t border-border py-10">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Round-trip latency
          </h2>
          <div className="mt-6 flex flex-wrap gap-10">
            <Stat label="median" value={`${median} ms`} />
            <Stat label="p95" value={`${p95} ms`} />
            <Stat label="samples" value={String(latencies.length)} />
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Measured from the instant recording stopped to the instant the
            buyer&rsquo;s audio was ready to play. Includes Whisper, the buyer model,
            text-to-speech and every network hop between them. Excludes how long
            you chose to speak and how long the reply takes to play, because
            neither is the system&rsquo;s to control.
          </p>
        </section>
      )}

      <section className="border-t border-border py-10">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          What the state machine did
        </h2>
        <ol className="mt-6 space-y-3">
          {history.map((t, i) => (
            <li key={i} className="flex flex-wrap items-baseline gap-3 font-mono text-xs">
              <span className="w-6 tabular-nums text-muted-foreground">{i + 1}</span>
              <span style={{ color: stateColor(t.from) }}>{t.from}</span>
              <span className="text-muted-foreground" aria-hidden>
                →
              </span>
              <span style={{ color: stateColor(t.to) }}>{t.to}</span>
              <span className="text-muted-foreground">{t.trigger}</span>
              {t.constrained && (
                <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  constrained
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-border py-10">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Transcript
        </h2>
        <div className="mt-6 space-y-5">
          {transcript.map((m, i) => (
            <div key={i} className={m.role === 'rep' ? 'pl-8' : ''}>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {m.role === 'rep' ? 'You' : (scenario?.buyer.name ?? 'Buyer')}
              </p>
              <p
                className={`leading-relaxed ${m.role === 'rep' ? 'text-muted-foreground' : ''}`}
              >
                {m.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border pt-8">
        <Link
          href={`/practice/${run.scenarioId}`}
          className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Run it again
        </Link>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-2xl tabular-nums">{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

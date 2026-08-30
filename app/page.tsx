import Link from 'next/link';
import { SCENARIOS } from '@/data/scenarios';
import { StatePill } from '@/components/StateLadder';
import { LIMITS } from '@/lib/ai/client';

const DIFFICULTY: Record<string, string> = {
  starter: 'Starter',
  intermediate: 'Intermediate',
  hard: 'Hard',
};

const COMPETENCIES = [
  {
    name: 'Discovery',
    method: 'computed',
    line: 'Open and closed questions per turn, and whether they were spread through the call or bunched at the front.',
  },
  {
    name: 'Talk-to-listen',
    method: 'computed',
    line: 'Your share of the words spoken. Full marks between 35% and 50%.',
  },
  {
    name: 'Objection handling',
    method: 'state machine',
    line: 'Every turn that began with the buyer resistant, and whether you moved them up, held, or lost ground.',
  },
  {
    name: 'Next-step close',
    method: 'model judged',
    line: 'Whether you secured something specific and dated. The grader has to quote your own words back.',
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-24">
      <header className="border-b border-border py-16 sm:py-24">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Pitchback
        </p>
        <h1 className="mt-6 text-4xl font-medium leading-[1.1] tracking-tight sm:text-6xl">
          Practise the call
          <br />
          before it counts.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Talk out loud to a simulated buyer who pushes back, changes their mind
          slowly, and hangs up if you waste their time. Then get scored on four
          things you can check for yourself.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="#scenarios"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Pick a call
          </Link>
          <span className="font-mono text-xs text-muted-foreground">
            No account. Microphone required. {LIMITS.maxTurns} turns per run.
          </span>
        </div>
      </header>

      <section id="scenarios" className="scroll-mt-8 py-16">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Five calls
        </h2>
        <ul className="mt-8 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
          {SCENARIOS.map((s) => (
            <li key={s.id} className="bg-card">
              <Link
                href={`/practice/${s.id}`}
                className="flex h-full flex-col gap-4 p-6 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-medium tracking-tight">{s.title}</h3>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {DIFFICULTY[s.difficulty]}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.summary}</p>
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                  <StatePill state={s.openingState} />
                  <span className="font-mono text-xs text-muted-foreground">
                    {s.buyer.name} · {s.buyer.role}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-border py-16">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          How it scores you
        </h2>
        <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">
          Two of the four are arithmetic on the transcript, one is read off the
          state machine, and only the last is a model&rsquo;s opinion &mdash; and that
          one has to quote you. The thresholds come from published analyses of
          real sales calls, not from a number someone liked the sound of.
        </p>
        <dl className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
          {COMPETENCIES.map((c) => (
            <div key={c.name} className="flex flex-col gap-2 bg-card p-6">
              <dt className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{c.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {c.method}
                </span>
              </dt>
              <dd className="text-sm leading-relaxed text-muted-foreground">{c.line}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-border py-16">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          The buyer is a state machine
        </h2>
        <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">
          The model plays the buyer, but it does not decide where the buyer
          lands. It proposes a direction each turn and a seven-state machine
          decides whether that move is legal. Movement is capped at one rung a
          turn; talking for over {' '}
          <span className="font-mono text-foreground">120</span> words costs you a
          rung whatever you said; and nobody reaches{' '}
          <span className="font-mono text-foreground">committed</span> without
          being asked for something specific. Without those rules the model will
          take a hostile prospect to &ldquo;sounds great, send a contract&rdquo; in two
          turns, which teaches you nothing.
        </p>
      </section>

      <footer className="border-t border-border pt-8 text-sm text-muted-foreground">
        <p>
          Built by Mayank Goel.{' '}
          <a
            className="underline underline-offset-4 hover:text-foreground"
            href="https://github.com/mayankgoel214/Pitchback"
          >
            Source on GitHub
          </a>
          .
        </p>
      </footer>
    </main>
  );
}

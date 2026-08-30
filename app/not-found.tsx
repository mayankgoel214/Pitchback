import Link from 'next/link';
import { SCENARIOS } from '@/data/scenarios';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        404
      </p>
      <h1 className="mt-6 text-3xl font-medium tracking-tight sm:text-4xl">
        Nobody picked up.
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
        That page does not exist. The calls that do are below.
      </p>

      <ul className="mt-10 flex flex-wrap gap-3">
        {SCENARIOS.map((s) => (
          <li key={s.id}>
            <Link
              href={`/practice/${s.id}`}
              className="inline-block rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
            >
              {s.title}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/"
        className="mt-10 self-start text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Back to the start
      </Link>
    </main>
  );
}

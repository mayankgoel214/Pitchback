import { notFound } from 'next/navigation';
import { getScenario, SCENARIOS } from '@/data/scenarios';
import { CallSurface } from '@/components/CallSurface';

export function generateStaticParams() {
  return SCENARIOS.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = getScenario(id);
  if (!scenario) return { title: 'Pitchback' };
  return {
    title: `${scenario.title} — Pitchback`,
    description: scenario.summary,
  };
}

export default async function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = getScenario(id);
  if (!scenario) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <CallSurface scenario={scenario} />
    </main>
  );
}

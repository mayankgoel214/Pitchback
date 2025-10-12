import Link from 'next/link';
import { Scenario } from '@/lib/types/scenario';
import { TrainingSession } from '@/lib/types/session';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ScenarioCardProps {
  scenario: Scenario;
  previousSessions?: TrainingSession[];
}

const difficultyColors = {
  beginner: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  intermediate: 'bg-amber-100 text-amber-700 border-amber-200',
  advanced: 'bg-rose-100 text-rose-700 border-rose-200',
};

const difficultyIcons = {
  beginner: '○',
  intermediate: '◐',
  advanced: '●',
};

const categoryLabels: Record<string, string> = {
  angry_guests: 'Angry Guests',
  language_barriers: 'Language Barriers',
  emergencies: 'Emergencies',
  special_requests: 'Special Requests',
  billing_disputes: 'Billing Disputes',
};

const categoryIcons: Record<string, React.ReactNode> = {
  angry_guests: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  language_barriers: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
  ),
  emergencies: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  special_requests: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  billing_disputes: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

export default function ScenarioCard({ scenario, previousSessions = [] }: ScenarioCardProps) {
  // Find sessions for this scenario
  const scenarioSessions = previousSessions.filter(s => s.scenario_id === scenario.id);
  const completedSessions = scenarioSessions.filter(s => s.status === 'completed');
  const hasCompleted = completedSessions.length > 0;

  // Get best score
  const bestScore = hasCompleted
    ? Math.max(...completedSessions.map(s => s.overall_score || 0))
    : null;

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (score >= 60) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  };

  return (
    <Link href={`/scenarios/${scenario.id}`} className="group">
      <Card className="rounded-3xl border-2 hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-600/20 transition-all duration-300 p-7 cursor-pointer relative overflow-hidden transform hover:-translate-y-1">
        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Decorative Corner Badge */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-blue-600/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Completion Badge */}
        {hasCompleted && bestScore !== null && (
          <div className="absolute top-4 right-4">
            <div className={`px-3 py-1.5 rounded-lg border-2 ${getScoreBadge(bestScore)} backdrop-blur-sm flex items-center gap-2`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-bold">Best: {bestScore.toFixed(0)}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-muted group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-indigo-600 rounded-2xl transition-all duration-300 flex-shrink-0 shadow-sm group-hover:shadow-md group-hover:shadow-blue-600/20 group-hover:scale-110 transform">
                <div className="group-hover:text-white transition-colors">
                  {categoryIcons[scenario.category]}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold mb-1.5 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {scenario.title}
                </h3>
                <p className="text-sm text-muted-foreground font-medium">
                  {categoryLabels[scenario.category] || scenario.category}
                </p>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-xl text-xs font-bold border-2 flex items-center gap-2 flex-shrink-0 shadow-sm ${
                difficultyColors[scenario.difficulty]
              }`}
            >
              <span className="text-base leading-none">{difficultyIcons[scenario.difficulty]}</span>
              {scenario.difficulty.charAt(0).toUpperCase() + scenario.difficulty.slice(1)}
            </span>
          </div>

          {/* Context Preview */}
          <p className="text-muted-foreground text-sm mb-5 line-clamp-2 leading-relaxed">
            {scenario.description}
          </p>

          {/* Key Competencies */}
          <div className="mb-6">
            <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">Key Competencies:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs px-3 py-2 rounded-xl font-semibold">
                Empathy
              </Badge>
              <Badge variant="secondary" className="text-xs px-3 py-2 rounded-xl font-semibold">
                Communication
              </Badge>
              <Badge variant="secondary" className="text-xs px-3 py-2 rounded-xl font-semibold">
                Problem Solving
              </Badge>
              <Badge variant="secondary" className="text-xs px-3 py-2 rounded-xl font-semibold">
                Professionalism
              </Badge>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex justify-between items-center pt-5 border-t-2">
            <div className="flex items-center gap-5 text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                15-20 min
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {hasCompleted ? `${completedSessions.length} attempt${completedSessions.length > 1 ? 's' : ''}` : 'Up to 10 turns'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-blue-600 group-hover:text-indigo-600 font-bold text-sm transition-colors">
              <span>{hasCompleted ? 'Practice Again' : 'Begin Training'}</span>
              <svg className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

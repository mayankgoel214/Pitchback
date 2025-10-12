import Link from 'next/link';
import { TrainingSession } from '@/lib/types/session';
import { Scenario } from '@/lib/types/scenario';

interface ContinueTrainingProps {
  sessions: TrainingSession[];
  scenarios: Scenario[];
}

export default function ContinueTraining({ sessions, scenarios }: ContinueTrainingProps) {
  const inProgressSessions = sessions.filter((s) => s.status === 'in_progress');

  if (inProgressSessions.length === 0) {
    return null;
  }

  const getScenarioTitle = (scenarioId: string) => {
    const scenario = scenarios.find((s) => s.id === scenarioId);
    return scenario?.title || 'Unknown Scenario';
  };

  const getScenarioCategory = (scenarioId: string) => {
    const scenario = scenarios.find((s) => s.id === scenarioId);
    const categoryLabels: Record<string, string> = {
      angry_guests: 'Angry Guests',
      language_barriers: 'Language Barriers',
      emergencies: 'Emergencies',
      special_requests: 'Special Requests',
      billing_disputes: 'Billing Disputes',
    };
    return categoryLabels[scenario?.category || ''] || scenario?.category || 'General';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="bg-gradient-to-br from-cyan-900/30 via-slate-800 to-blue-900/30 border-2 border-cyan-500/30 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-400/30">
          <svg className="w-5 h-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Continue Your Training</h2>
          <p className="text-sm text-cyan-300/70">Pick up where you left off</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {inProgressSessions.map((session) => (
          <Link
            key={session.id}
            href={`/scenarios/${session.scenario_id}/practice?session=${session.id}`}
            className="group"
          >
            <div className="bg-slate-900/60 border-2 border-slate-700 hover:border-cyan-500 rounded-xl p-5 transition-all hover:bg-slate-900 hover:shadow-lg hover:shadow-cyan-500/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white mb-1 truncate group-hover:text-cyan-300 transition-colors">
                    {getScenarioTitle(session.scenario_id)}
                  </h3>
                  <p className="text-xs text-slate-400">{getScenarioCategory(session.scenario_id)}</p>
                </div>
                <div className="ml-3">
                  <span className="inline-flex items-center px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-xs font-semibold text-amber-300">
                    <span className="w-2 h-2 bg-amber-400 rounded-full mr-2 animate-pulse"></span>
                    In Progress
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Started {formatTimeAgo(session.started_at)}
                </span>
                {session.turns_completed > 0 && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {session.turns_completed} turns
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <span className="text-sm font-semibold text-cyan-300 group-hover:text-cyan-200 transition-colors">
                  Resume Session
                </span>
                <svg className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

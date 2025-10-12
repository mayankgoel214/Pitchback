import Link from 'next/link';
import { TrainingSession } from '@/lib/types/session';
import { Scenario } from '@/lib/types/scenario';

interface RecentSessionsProps {
  sessions: TrainingSession[];
  scenarios: Scenario[];
}

export default function RecentSessions({ sessions, scenarios }: RecentSessionsProps) {
  // Get only completed sessions and limit to 5 most recent
  const recentSessions = sessions
    .filter((s) => s.status === 'completed')
    .slice(0, 5);

  if (recentSessions.length === 0) {
    return (
      <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-full mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No Training History Yet</h3>
        <p className="text-sm text-slate-400">Complete a scenario to see your progress here</p>
      </div>
    );
  }

  const getScenarioTitle = (scenarioId: string) => {
    const scenario = scenarios.find((s) => s.id === scenarioId);
    return scenario?.title || 'Unknown Scenario';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (score >= 60) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  };

  return (
    <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
            <svg className="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Recent Training Sessions</h2>
        </div>
        <span className="text-sm text-slate-400">{recentSessions.length} sessions</span>
      </div>

      <div className="space-y-3">
        {recentSessions.map((session) => (
          <Link
            key={session.id}
            href={`/scenarios/${session.scenario_id}/results?session=${session.id}`}
            className="block group"
          >
            <div className="bg-slate-900/50 border border-slate-700 hover:border-blue-500/50 rounded-xl p-4 transition-all hover:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-200 mb-1 truncate group-hover:text-blue-300 transition-colors">
                    {getScenarioTitle(session.scenario_id)}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(session.completed_at || session.started_at)}
                    </span>
                    {session.duration_seconds && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {Math.round(session.duration_seconds / 60)} min
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${getScoreBadge(session.overall_score || 0)}`}>
                    {session.overall_score?.toFixed(0) || 0}
                  </div>
                  {session.evaluation?.scores.overall && session.evaluation.scores.overall >= 70 ? (
                    <div className="flex items-center gap-1 text-emerald-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-semibold">Passed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-rose-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-xs font-semibold">Retry</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Competency scores mini preview */}
              <div className="mt-3 pt-3 border-t border-slate-700 flex gap-2">
                {session.scores && (
                  <>
                    <div className="flex-1 bg-slate-800 rounded px-2 py-1">
                      <div className="text-xs text-slate-500 mb-0.5">Empathy</div>
                      <div className={`text-xs font-bold ${getScoreColor(session.scores.empathy)}`}>
                        {session.scores.empathy}
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-800 rounded px-2 py-1">
                      <div className="text-xs text-slate-500 mb-0.5">Clarity</div>
                      <div className={`text-xs font-bold ${getScoreColor(session.scores.clarity)}`}>
                        {session.scores.clarity}
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-800 rounded px-2 py-1">
                      <div className="text-xs text-slate-500 mb-0.5">Problem Solving</div>
                      <div className={`text-xs font-bold ${getScoreColor(session.scores.problem_solving)}`}>
                        {session.scores.problem_solving}
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-800 rounded px-2 py-1">
                      <div className="text-xs text-slate-500 mb-0.5">Professionalism</div>
                      <div className={`text-xs font-bold ${getScoreColor(session.scores.professionalism)}`}>
                        {session.scores.professionalism}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

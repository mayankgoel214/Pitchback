import { TrainingSession } from '@/lib/types/session';

interface ProgressOverviewProps {
  sessions: TrainingSession[];
}

export default function ProgressOverview({ sessions }: ProgressOverviewProps) {
  const completedSessions = sessions.filter((s) => s.status === 'completed');

  // Calculate average score
  const averageScore = completedSessions.length > 0
    ? completedSessions.reduce((acc, session) => {
        return acc + (session.overall_score || 0);
      }, 0) / completedSessions.length
    : 0;

  // Calculate total training time (in minutes)
  const totalMinutes = completedSessions.reduce((acc, session) => {
    return acc + ((session.duration_seconds || 0) / 60);
  }, 0);

  // Count unique scenarios
  const uniqueScenarios = new Set(completedSessions.map(s => s.scenario_id)).size;

  // Calculate score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/30';
    if (score >= 60) return 'bg-amber-500/20 border-amber-500/30';
    return 'bg-rose-500/20 border-rose-500/30';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Scenarios Completed */}
      <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 hover:border-cyan-500/50 transition-all group">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-400/30 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-white">{uniqueScenarios}</div>
          </div>
        </div>
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Scenarios Completed</h3>
        <p className="text-xs text-slate-500">Out of {uniqueScenarios} unique scenarios</p>
      </div>

      {/* Average Score */}
      <div className={`bg-slate-800 border-2 rounded-2xl p-6 hover:border-opacity-70 transition-all group ${getScoreBg(averageScore)}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-white/10 rounded-xl border border-white/20 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore.toFixed(0)}
            </div>
          </div>
        </div>
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Average Score</h3>
        <p className="text-xs text-slate-500">Across all sessions</p>
      </div>

      {/* Total Training Time */}
      <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 hover:border-purple-500/50 transition-all group">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-400/30 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-white">{Math.round(totalMinutes)}</div>
          </div>
        </div>
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Training Minutes</h3>
        <p className="text-xs text-slate-500">Total practice time</p>
      </div>

      {/* Total Sessions */}
      <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all group">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-400/30 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-white">{completedSessions.length}</div>
          </div>
        </div>
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Total Sessions</h3>
        <p className="text-xs text-slate-500">Practice attempts</p>
      </div>
    </div>
  );
}

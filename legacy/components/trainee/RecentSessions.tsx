import Link from 'next/link';
import { TrainingSession } from '@/lib/types/session';
import { Scenario } from '@/lib/types/scenario';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, CheckCircle2, X, FileText } from 'lucide-react';

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
      <Card>
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Training History Yet</h3>
          <p className="text-sm text-muted-foreground">Complete a scenario to see your progress here</p>
        </CardContent>
      </Card>
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-xl">Recent Training Sessions</CardTitle>
          </div>
          <Badge variant="secondary">{recentSessions.length} sessions</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {recentSessions.map((session) => (
            <Link
              key={session.id}
              href={`/scenarios/${session.scenario_id}/results?session=${session.id}`}
              className="block group"
            >
              <Card className="hover:border-blue-500/50 transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {getScenarioTitle(session.scenario_id)}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(session.completed_at || session.started_at)}
                        </span>
                        {session.duration_seconds && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {Math.round(session.duration_seconds / 60)} min
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <Badge variant="secondary" className={`px-3 py-1.5 text-sm font-bold ${getScoreBadge(session.overall_score || 0)}`}>
                        {session.overall_score?.toFixed(0) || 0}
                      </Badge>
                      {session.evaluation?.scores.overall && session.evaluation.scores.overall >= 70 ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-semibold">Passed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                          <X className="w-4 h-4" />
                          <span className="text-xs font-semibold">Retry</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Competency scores mini preview */}
                  <div className="mt-3 pt-3 border-t flex gap-2">
                    {session.scores && (
                      <>
                        <div className="flex-1 bg-muted rounded px-2 py-1">
                          <div className="text-xs text-muted-foreground mb-0.5">Empathy</div>
                          <div className={`text-xs font-bold ${getScoreColor(session.scores.empathy)}`}>
                            {session.scores.empathy}
                          </div>
                        </div>
                        <div className="flex-1 bg-muted rounded px-2 py-1">
                          <div className="text-xs text-muted-foreground mb-0.5">Clarity</div>
                          <div className={`text-xs font-bold ${getScoreColor(session.scores.clarity)}`}>
                            {session.scores.clarity}
                          </div>
                        </div>
                        <div className="flex-1 bg-muted rounded px-2 py-1">
                          <div className="text-xs text-muted-foreground mb-0.5">Problem Solving</div>
                          <div className={`text-xs font-bold ${getScoreColor(session.scores.problem_solving)}`}>
                            {session.scores.problem_solving}
                          </div>
                        </div>
                        <div className="flex-1 bg-muted rounded px-2 py-1">
                          <div className="text-xs text-muted-foreground mb-0.5">Professionalism</div>
                          <div className={`text-xs font-bold ${getScoreColor(session.scores.professionalism)}`}>
                            {session.scores.professionalism}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

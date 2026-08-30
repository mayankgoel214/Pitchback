import { TrainingSession } from '@/lib/types/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Star, Clock, BarChart3 } from 'lucide-react';

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
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getScoreVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Scenarios Completed */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Scenarios Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uniqueScenarios}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {uniqueScenarios === 1 ? 'unique scenario' : 'unique scenarios'}
          </p>
          <Progress value={(uniqueScenarios / Math.max(uniqueScenarios, 5)) * 100} className="mt-3" />
        </CardContent>
      </Card>

      {/* Average Score */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
            {averageScore.toFixed(0)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Across {completedSessions.length} {completedSessions.length === 1 ? 'session' : 'sessions'}
          </p>
          <Progress value={averageScore} className="mt-3" />
        </CardContent>
      </Card>

      {/* Total Training Time */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Training Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(totalMinutes)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            minutes practiced
          </p>
          <Progress value={Math.min((totalMinutes / 60) * 100, 100)} className="mt-3" />
        </CardContent>
      </Card>

      {/* Total Sessions */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedSessions.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            practice attempts
          </p>
          <Progress value={Math.min((completedSessions.length / 10) * 100, 100)} className="mt-3" />
        </CardContent>
      </Card>
    </div>
  );
}

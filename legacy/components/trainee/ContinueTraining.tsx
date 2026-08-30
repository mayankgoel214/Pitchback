import Link from 'next/link';
import { TrainingSession } from '@/lib/types/session';
import { Scenario } from '@/lib/types/scenario';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, MessageCircle, ArrowRight } from 'lucide-react';

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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-lg">
            <Play className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Continue Your Training</CardTitle>
            <p className="text-sm text-muted-foreground">Pick up where you left off</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inProgressSessions.map((session) => (
            <Link
              key={session.id}
              href={`/scenarios/${session.scenario_id}/practice?session=${session.id}`}
              className="group"
            >
              <Card className="hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {getScenarioTitle(session.scenario_id)}
                      </h3>
                      <p className="text-xs text-muted-foreground">{getScenarioCategory(session.scenario_id)}</p>
                    </div>
                    <div className="ml-3">
                      <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
                        <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></span>
                        In Progress
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Started {formatTimeAgo(session.started_at)}
                    </span>
                    {session.turns_completed > 0 && (
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {session.turns_completed} turns
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                      Resume Session
                    </span>
                    <ArrowRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
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

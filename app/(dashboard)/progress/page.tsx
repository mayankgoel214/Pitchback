'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import ProgressOverview from '@/components/trainee/ProgressOverview';
import { TrainingSession } from '@/lib/types/session';
import { Scenario } from '@/lib/types/scenario';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Award, Target, Calendar } from 'lucide-react';

export default function ProgressPage() {
  const [userSessions, setUserSessions] = useState<TrainingSession[]>([]);
  const [allScenarios, setAllScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuthContext();

  // Fetch scenarios
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/scenarios', { headers });
        const data = await response.json();

        if (data.success) {
          setAllScenarios(data.data);
        }
      } catch (error) {
        console.error('Error fetching scenarios:', error);
      }
    };

    fetchScenarios();
  }, [token]);

  // Fetch user sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/sessions?trainee_id=${user.id}`, { headers });
        const data = await response.json();

        if (data.success) {
          setUserSessions(data.data);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user?.id, token]);

  // Calculate detailed stats
  const completedSessions = userSessions.filter(s => s.status === 'completed');
  const scenarioProgress = allScenarios.map(scenario => {
    const scenarioSessions = completedSessions.filter(s => s.scenario_id === scenario.id);
    const avgScore = scenarioSessions.length > 0
      ? scenarioSessions.reduce((acc, s) => acc + (s.overall_score || 0), 0) / scenarioSessions.length
      : 0;

    return {
      scenario,
      attempts: scenarioSessions.length,
      averageScore: Math.round(avgScore),
    };
  });

  // Sort by attempts (most practiced first)
  const sortedProgress = [...scenarioProgress].sort((a, b) => b.attempts - a.attempts);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Progress Overview</h1>
        <p className="text-xl text-muted-foreground">
          Track your learning journey and skill development
        </p>
      </div>

      {/* Main Progress Stats */}
      <ProgressOverview sessions={userSessions} />

      {/* Scenario-by-Scenario Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Scenario Progress</h2>
          <Badge variant="secondary">
            {scenarioProgress.filter(p => p.attempts > 0).length} / {allScenarios.length} practiced
          </Badge>
        </div>

        {sortedProgress.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No scenarios practiced yet</CardTitle>
              <CardDescription>
                Start practicing scenarios to see your progress here
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sortedProgress.map(({ scenario, attempts, averageScore }) => (
              <Card key={scenario.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{scenario.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {scenario.context_description}
                      </CardDescription>
                    </div>
                    {attempts > 0 && (
                      <Badge variant={averageScore >= 80 ? 'default' : averageScore >= 60 ? 'secondary' : 'destructive'}>
                        {averageScore}% avg
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {attempts === 0 ? 'Not started' : `${attempts} ${attempts === 1 ? 'attempt' : 'attempts'}`}
                    </span>
                    {attempts > 0 && (
                      <span className={`font-medium ${
                        averageScore >= 80 ? 'text-emerald-600' :
                        averageScore >= 60 ? 'text-amber-600' :
                        'text-rose-600'
                      }`}>
                        Score: {averageScore}%
                      </span>
                    )}
                  </div>
                  {attempts > 0 && (
                    <Progress value={averageScore} className="h-2" />
                  )}
                  {attempts === 0 && (
                    <Progress value={0} className="h-2" />
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                    <Badge variant="outline" className="text-xs">
                      {scenario.difficulty}
                    </Badge>
                    <span>•</span>
                    <span>{scenario.category}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Learning Milestones */}
      {completedSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Learning Milestones
            </CardTitle>
            <CardDescription>
              Achievements unlocked through your training
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {completedSessions.length >= 1 && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">First Steps</p>
                    <p className="text-xs text-muted-foreground">Complete 1 session</p>
                  </div>
                </div>
              )}

              {completedSessions.length >= 5 && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium">Getting Started</p>
                    <p className="text-xs text-muted-foreground">Complete 5 sessions</p>
                  </div>
                </div>
              )}

              {completedSessions.length >= 10 && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium">Dedicated Learner</p>
                    <p className="text-xs text-muted-foreground">Complete 10 sessions</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

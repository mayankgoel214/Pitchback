'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { TrainingSession } from '@/lib/types/session';
import { Scenario } from '@/lib/types/scenario';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Calendar, CheckCircle2, X, FileText, ArrowUpDown, Play } from 'lucide-react';

export default function SessionsPage() {
  const [userSessions, setUserSessions] = useState<TrainingSession[]>([]);
  const [allScenarios, setAllScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'score'>('newest');
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

  const getScenarioTitle = (scenarioId: string) => {
    const scenario = allScenarios.find((s) => s.id === scenarioId);
    return scenario?.title || 'Unknown Scenario';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  // Filter sessions
  let filteredSessions = userSessions;
  if (filter === 'completed') {
    filteredSessions = userSessions.filter(s => s.status === 'completed');
  } else if (filter === 'in_progress') {
    filteredSessions = userSessions.filter(s => s.status === 'in_progress');
  }

  // Sort sessions
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
    } else if (sortOrder === 'oldest') {
      return new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
    } else {
      // Sort by score
      return (b.overall_score || 0) - (a.overall_score || 0);
    }
  });

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Training Sessions</h1>
        <p className="text-xl text-muted-foreground">
          Review your past training sessions and performance
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userSessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {userSessions.filter(s => s.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {userSessions.filter(s => s.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const orders: Array<'newest' | 'oldest' | 'score'> = ['newest', 'oldest', 'score'];
              const currentIndex = orders.indexOf(sortOrder);
              setSortOrder(orders[(currentIndex + 1) % orders.length]);
            }}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortOrder === 'newest' ? 'Newest' : sortOrder === 'oldest' ? 'Oldest' : 'Score'}
          </Button>
        </div>
      </div>

      {/* Sessions List */}
      {sortedSessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No sessions found</CardTitle>
            <CardDescription className="text-center mb-4">
              {filter === 'all'
                ? 'Start practicing scenarios to see your sessions here'
                : filter === 'completed'
                ? 'No completed sessions yet'
                : 'No sessions in progress'}
            </CardDescription>
            <Button asChild>
              <Link href="/scenarios">Browse Scenarios</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        {getScenarioTitle(session.scenario_id)}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {formatDate(session.started_at)}
                        </span>
                        {session.duration_seconds && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {Math.round(session.duration_seconds / 60)} minutes
                          </span>
                        )}
                        <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                          {session.status === 'completed' ? 'Completed' : 'In Progress'}
                        </Badge>
                      </div>
                    </div>

                    {/* Competency scores */}
                    {session.status === 'completed' && session.scores && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <div className="text-xs text-muted-foreground mb-1">Empathy</div>
                          <div className={`text-sm font-bold ${getScoreColor(session.scores.empathy)}`}>
                            {session.scores.empathy}%
                          </div>
                        </div>
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <div className="text-xs text-muted-foreground mb-1">Clarity</div>
                          <div className={`text-sm font-bold ${getScoreColor(session.scores.clarity)}`}>
                            {session.scores.clarity}%
                          </div>
                        </div>
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <div className="text-xs text-muted-foreground mb-1">Problem Solving</div>
                          <div className={`text-sm font-bold ${getScoreColor(session.scores.problem_solving)}`}>
                            {session.scores.problem_solving}%
                          </div>
                        </div>
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <div className="text-xs text-muted-foreground mb-1">Professionalism</div>
                          <div className={`text-sm font-bold ${getScoreColor(session.scores.professionalism)}`}>
                            {session.scores.professionalism}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {session.status === 'completed' && typeof session.overall_score === 'number' && (
                      <div className="text-right">
                        <Badge variant={getScoreBadge(session.overall_score)} className="text-base px-3 py-1.5">
                          {session.overall_score.toFixed(0)}%
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {session.overall_score >= 70 ? 'Passed' : 'Retry recommended'}
                        </p>
                      </div>
                    )}

                    <Button asChild variant={session.status === 'in_progress' ? 'default' : 'outline'}>
                      <Link href={
                        session.status === 'in_progress'
                          ? `/scenarios/${session.scenario_id}/practice`
                          : `/scenarios/${session.scenario_id}/results?sessionId=${session.id}`
                      }>
                        {session.status === 'in_progress' ? (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Continue
                          </>
                        ) : (
                          'View Results'
                        )}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

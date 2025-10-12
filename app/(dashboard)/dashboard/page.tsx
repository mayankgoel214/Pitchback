'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ContinueTraining from '@/components/trainee/ContinueTraining';
import { Scenario } from '@/lib/types/scenario';
import { TrainingSession } from '@/lib/types/session';
import {
  TrendingUp,
  History,
  Lightbulb,
  Film,
  ArrowRight,
  Clock,
  Award,
  Target
} from 'lucide-react';

export default function DashboardPage() {
  const [allScenarios, setAllScenarios] = useState<Scenario[]>([]);
  const [userSessions, setUserSessions] = useState<TrainingSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const { user, token } = useAuthContext();

  // Fetch scenarios from database
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
        setSessionsLoading(true);
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
        setSessionsLoading(false);
      }
    };

    fetchSessions();
  }, [user?.id, token]);

  // Calculate stats
  const completedSessions = userSessions.filter(s => s.status === 'completed').length;
  const inProgressSessions = userSessions.filter(s => s.status === 'in_progress').length;
  const totalScenarios = allScenarios.length;

  // Calculate average score
  const sessionsWithScores = userSessions.filter(s => s.overall_score !== null && s.overall_score !== undefined);
  const averageScore = sessionsWithScores.length > 0
    ? Math.round(sessionsWithScores.reduce((acc, s) => acc + (s.overall_score || 0), 0) / sessionsWithScores.length)
    : 0;

  const quickLinks = [
    {
      title: 'Progress Overview',
      description: 'View your learning progress and achievements',
      icon: TrendingUp,
      href: '/progress',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Recent Sessions',
      description: 'Review your past training sessions',
      icon: History,
      href: '/sessions',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Improvement Areas',
      description: 'Identify areas for skill development',
      icon: Lightbulb,
      href: '/improvements',
      color: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Browse Scenarios',
      description: 'Explore all available training scenarios',
      icon: Film,
      href: '/scenarios',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-xl text-muted-foreground">
          Continue your training journey and improve your hospitality skills
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{userSessions.length}</div>
                <p className="text-xs text-muted-foreground">
                  {completedSessions} completed, {inProgressSessions} in progress
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{averageScore}%</div>
                <p className="text-xs text-muted-foreground">
                  {sessionsWithScores.length} evaluated sessions
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scenarios Available</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScenarios}</div>
            <p className="text-xs text-muted-foreground">
              Ready to practice
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{completedSessions}</div>
                <p className="text-xs text-muted-foreground">
                  Training sessions finished
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Continue Training Section */}
      {!sessionsLoading && userSessions.some(s => s.status === 'in_progress') && (
        <ContinueTraining sessions={userSessions} scenarios={allScenarios} />
      )}

      {/* Quick Links */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${link.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-4">{link.title}</CardTitle>
                    <CardDescription>{link.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Get Started */}
      {!sessionsLoading && userSessions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Film className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mb-2">Ready to get started?</CardTitle>
            <CardDescription className="text-center mb-4 max-w-md">
              Begin your training journey by exploring our scenarios and starting your first practice session
            </CardDescription>
            <Button asChild>
              <Link href="/scenarios">
                Browse Scenarios
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

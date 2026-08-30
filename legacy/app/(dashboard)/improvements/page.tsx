'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { TrainingSession } from '@/lib/types/session';
import { Scenario } from '@/lib/types/scenario';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Heart,
  MessageCircle,
  Lightbulb,
  Briefcase,
  Zap,
  ArrowRight,
  Target,
  CheckCircle
} from 'lucide-react';

interface CompetencyData {
  name: string;
  key: 'empathy' | 'clarity' | 'problem_solving' | 'professionalism';
  avgScore: number;
  icon: React.ElementType;
  improvements: string[];
  strengths: string[];
  sessionCount: number;
}

export default function ImprovementsPage() {
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

  const completedSessions = userSessions.filter((s) => s.status === 'completed' && s.scores);

  // Calculate competency data
  const competencies: CompetencyData[] = [
    {
      name: 'Empathy',
      key: 'empathy',
      avgScore: 0,
      icon: Heart,
      improvements: [],
      strengths: [],
      sessionCount: 0,
    },
    {
      name: 'Communication Clarity',
      key: 'clarity',
      avgScore: 0,
      icon: MessageCircle,
      improvements: [],
      strengths: [],
      sessionCount: 0,
    },
    {
      name: 'Problem Solving',
      key: 'problem_solving',
      avgScore: 0,
      icon: Lightbulb,
      improvements: [],
      strengths: [],
      sessionCount: 0,
    },
    {
      name: 'Professionalism',
      key: 'professionalism',
      avgScore: 0,
      icon: Briefcase,
      improvements: [],
      strengths: [],
      sessionCount: 0,
    },
  ];

  if (completedSessions.length > 0) {
    competencies.forEach((comp) => {
      const scores = completedSessions.map((s) => s.scores[comp.key]);
      comp.avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      comp.sessionCount = scores.length;

      // Collect improvements and strengths
      const improvementsSet = new Set<string>();
      const strengthsSet = new Set<string>();

      completedSessions.forEach((session) => {
        if (session.evaluation?.detailed_feedback?.[comp.key]) {
          const feedback = session.evaluation.detailed_feedback[comp.key];

          if (feedback.areas_for_improvement) {
            feedback.areas_for_improvement.forEach((item) => improvementsSet.add(item));
          }

          if (feedback.strengths) {
            feedback.strengths.forEach((item) => strengthsSet.add(item));
          }
        }
      });

      comp.improvements = Array.from(improvementsSet);
      comp.strengths = Array.from(strengthsSet);
    });
  }

  // Sort by score
  const sortedCompetencies = [...competencies].sort((a, b) => a.avgScore - b.avgScore);
  const weakestCompetencies = sortedCompetencies.slice(0, 2);
  const strongestCompetencies = [...competencies].sort((a, b) => b.avgScore - a.avgScore).slice(0, 2);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-rose-500/10 border-rose-500/30';
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (completedSessions.length === 0) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Improvement Areas</h1>
          <p className="text-xl text-muted-foreground">
            Get personalized insights to enhance your skills
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No Performance Data Yet</CardTitle>
            <CardDescription className="text-center mb-4">
              Complete some scenarios to get personalized improvement recommendations
            </CardDescription>
            <Button asChild>
              <Link href="/scenarios">Browse Scenarios</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Improvement Areas</h1>
        <p className="text-xl text-muted-foreground">
          Personalized insights based on {completedSessions.length} completed sessions
        </p>
      </div>

      {/* Focus Areas (Weakest Competencies) */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Focus Areas</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {weakestCompetencies.map((comp) => {
            const Icon = comp.icon;
            return (
              <Card key={comp.key} className={`border-2 ${getScoreBg(comp.avgScore)}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle>{comp.name}</CardTitle>
                        <CardDescription>
                          {comp.sessionCount} {comp.sessionCount === 1 ? 'session' : 'sessions'} evaluated
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getScoreColor(comp.avgScore)}`}>
                        {comp.avgScore.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={comp.avgScore} className="h-2" />

                  {comp.improvements.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Areas to Improve
                      </h4>
                      <ul className="space-y-2">
                        {comp.improvements.slice(0, 5).map((improvement, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-0.5">•</span>
                            <span className="flex-1 text-muted-foreground">{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* All Competencies Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">All Competencies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {competencies.map((comp) => {
            const Icon = comp.icon;
            return (
              <Card key={comp.key} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <CardTitle className="text-base">{comp.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold mb-2 ${getScoreColor(comp.avgScore)}`}>
                    {comp.avgScore.toFixed(0)}%
                  </div>
                  <Progress value={comp.avgScore} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {comp.sessionCount} {comp.sessionCount === 1 ? 'session' : 'sessions'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Strengths */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Your Strengths</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {strongestCompetencies.map((comp) => {
            const Icon = comp.icon;
            return (
              <Card key={comp.key} className="border-emerald-500/30 bg-emerald-500/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-500/10 rounded-lg">
                        <Icon className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle>{comp.name}</CardTitle>
                        <CardDescription>Strong performance area</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-2xl font-bold text-emerald-600">
                        {comp.avgScore.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                {comp.strengths.length > 0 && (
                  <CardContent>
                    <h4 className="text-sm font-semibold mb-2">What you do well:</h4>
                    <ul className="space-y-2">
                      {comp.strengths.slice(0, 3).map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span className="flex-1 text-muted-foreground">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recommended Practice */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Recommended Practice
          </CardTitle>
          <CardDescription>
            Continue practicing to improve your weaker areas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {allScenarios.slice(0, 3).map((scenario) => (
            <Link key={scenario.id} href={`/scenarios/${scenario.id}`} className="block group">
              <div className="flex items-center justify-between p-4 bg-background hover:bg-muted border hover:border-blue-500/50 rounded-lg transition-all">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold group-hover:text-blue-600 transition-colors truncate">
                    {scenario.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {scenario.difficulty}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{scenario.category}</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

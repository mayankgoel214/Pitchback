'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Scenario } from '@/lib/types/scenario';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Hotel,
  Clock,
  MessageCircle,
  Tag,
  Info,
  MessageSquare,
  Target,
  CheckCircle2,
  Play,
  AlertCircle
} from 'lucide-react';

const difficultyConfig = {
  beginner: {
    variant: 'secondary' as const,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
  },
  intermediate: {
    variant: 'secondary' as const,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700'
  },
  advanced: {
    variant: 'secondary' as const,
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-300 dark:border-rose-700'
  },
};

const categoryLabels: Record<string, string> = {
  angry_guests: 'Angry Guests',
  language_barriers: 'Language Barriers',
  emergencies: 'Emergencies',
  special_requests: 'Special Requests',
  billing_disputes: 'Billing Disputes',
};

export default function ScenarioDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthContext();

  useEffect(() => {
    const fetchScenario = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        // Add auth token if available
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/scenarios/${id}`, { headers });
        const data = await response.json();

        if (data.success && data.data) {
          setScenario(data.data);
        } else {
          setError(data.error || 'Scenario not found');
          setScenario(null);
        }
      } catch (err) {
        console.error('Error fetching scenario:', err);
        setError('Failed to load scenario');
        setScenario(null);
      } finally {
        setLoading(false);
      }
    };

    fetchScenario();
  }, [id, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Error Loading Scenario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Scenario not found'}
              </AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/" className="flex items-center">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center">
                <Hotel className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-bold">HospitalityAI</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Hero Section */}
        <Card className="border-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <Badge variant="secondary" className="gap-2">
                  <Tag className="w-3 h-3" />
                  {categoryLabels[scenario.category] || scenario.category}
                </Badge>
                <CardTitle className="text-3xl md:text-4xl font-bold leading-tight">
                  {scenario.title}
                </CardTitle>
                <CardDescription className="text-base">
                  Practice scenario for hospitality training
                </CardDescription>
              </div>
              <Badge
                variant={difficultyConfig[scenario.difficulty].variant}
                className={`${difficultyConfig[scenario.difficulty].className} px-4 py-2 text-sm font-bold border-2`}
              >
                {scenario.difficulty.charAt(0).toUpperCase() + scenario.difficulty.slice(1)}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Badge variant="outline" className="gap-2 py-2 px-4">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">15-20 minutes</span>
              </Badge>
              <Badge variant="outline" className="gap-2 py-2 px-4">
                <MessageCircle className="w-4 h-4" />
                <span className="font-semibold">Interactive conversation</span>
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Scenario Context */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">Scenario Context</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {scenario.context_background || scenario.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* AI Guest Opening */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                <MessageSquare className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex-1 space-y-3">
                <CardTitle className="text-2xl">Guest&apos;s Opening Statement</CardTitle>
                <Card className="bg-muted/50 border-l-4 border-rose-500">
                  <CardContent className="pt-6">
                    <p className="text-base leading-relaxed italic">
                      &quot;{scenario.ai_guest_opening}&quot;
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Learning Objectives - Only show if available */}
        {scenario.learning_objectives && Array.isArray(scenario.learning_objectives) && scenario.learning_objectives.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                  <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <CardTitle className="text-2xl mb-2">Learning Objectives</CardTitle>
                    <CardDescription className="text-base">
                      By completing this scenario, you will be able to:
                    </CardDescription>
                  </div>
                  <ul className="space-y-3">
                    {scenario.learning_objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-3 group">
                        <div className="flex-shrink-0 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg group-hover:scale-110 transition-transform">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-base pt-1.5">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Evaluation Criteria */}
        <Card>
          <CardHeader className="space-y-4">
            <div>
              <CardTitle className="text-2xl mb-2">Evaluation Criteria</CardTitle>
              <CardDescription className="text-base">
                Your performance will be assessed across these key competency areas:
              </CardDescription>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(scenario.success_criteria).map(([key, criteria]) => (
                <Card key={key} className="border-2 hover:border-emerald-500 transition-colors group">
                  <CardHeader>
                    <CardTitle className="capitalize flex items-center gap-3 text-lg">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full group-hover:scale-125 transition-transform"></div>
                      {key.replace('_', ' ')}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {criteria.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground font-medium">Minimum passing score</span>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold">
                        {criteria.min_score}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardHeader>
        </Card>

        {/* Start Practice CTA */}
        <Card className="border-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
          <CardContent className="py-12 md:py-16 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl">
              <Play className="w-8 h-8" />
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Begin?
              </h2>
              <p className="text-white/90 text-lg max-w-2xl mx-auto leading-relaxed">
                Start your practice session now and engage with realistic AI-powered guest interactions. You can repeat this scenario as many times as needed to master the skills.
              </p>
            </div>

            <Button
              asChild
              size="lg"
              className="bg-white text-blue-600 hover:bg-white/90 font-bold text-lg px-8 py-6 h-auto shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              <Link href={`/scenarios/${scenario.id}/practice`} className="flex items-center gap-3">
                <Play className="w-5 h-5" />
                Start Practice Session
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

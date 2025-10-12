'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, BarChart3, CheckCircle2, XCircle, TrendingUp, Target, Home } from 'lucide-react';

interface EvaluationResult {
  problem_resolved: boolean;
  resolution_summary: string;
  overall_score: number;
  competencies: {
    empathy: { score: number; feedback: string; };
    clarity: { score: number; feedback: string; };
    problem_solving: { score: number; feedback: string; };
    professionalism: { score: number; feedback: string; };
  };
  strengths: string[];
  areas_for_improvement: string[];
  transcript: { speaker: string; text: string; timestamp: string; }[];
  turns_completed: number;
}

export default function ResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const scenarioId = params.id as string;
  const sessionId = searchParams.get('sessionId');

  const [results, setResults] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        // First, try to fetch from database API
        const response = await fetch(`/api/sessions/${sessionId}`);
        const data = await response.json();

        if (data.success && data.data.evaluation) {
          // Successfully fetched from database
          const session = data.data;
          const evaluation = session.evaluation;

          // Transform database evaluation to match UI structure
          // Note: Database doesn't store per-competency detailed feedback
          const transformedResults: EvaluationResult = {
            problem_resolved: evaluation.problem_resolved ?? true,
            resolution_summary: evaluation.resolution_summary ?? evaluation.overall_summary ?? 'Session completed successfully',
            overall_score: Math.round(evaluation.scores.overall),
            competencies: {
              empathy: {
                score: Math.round(evaluation.scores.empathy),
                feedback: evaluation.overall_summary || 'See overall feedback below for detailed insights.'
              },
              clarity: {
                score: Math.round(evaluation.scores.clarity),
                feedback: evaluation.overall_summary || 'See overall feedback below for detailed insights.'
              },
              problem_solving: {
                score: Math.round(evaluation.scores.problem_solving),
                feedback: evaluation.overall_summary || 'See overall feedback below for detailed insights.'
              },
              professionalism: {
                score: Math.round(evaluation.scores.professionalism),
                feedback: evaluation.overall_summary || 'See overall feedback below for detailed insights.'
              }
            },
            strengths: evaluation.best_practices || [],
            areas_for_improvement: evaluation.improvement_recommendations || [],
            transcript: session.transcript?.exchanges || [],
            turns_completed: session.turns_completed || 0
          };

          setTimeout(() => {
            setResults(transformedResults);
            setLoading(false);
          }, 1500);
        } else {
          // Fallback to localStorage for guest sessions
          console.log('No evaluation in database, checking localStorage...');
          const storedData = localStorage.getItem(`evaluation_${sessionId}`);

          if (!storedData) {
            console.error('No evaluation data found for session:', sessionId);
            setLoading(false);
            return;
          }

          const { evaluation, transcript, turns_completed } = JSON.parse(storedData);

          // Transform the evaluation data to match the UI structure
          const transformedResults: EvaluationResult = {
            problem_resolved: evaluation.problem_resolved ?? true,
            resolution_summary: evaluation.resolution_summary ?? 'Resolution status not available',
            overall_score: Math.round(evaluation.scores.overall),
            competencies: {
              empathy: {
                score: Math.round(evaluation.scores.empathy),
                feedback: [
                  ...evaluation.detailed_feedback.empathy.what_went_well.map((item: string) => `✓ ${item}`),
                  ...evaluation.detailed_feedback.empathy.areas_for_improvement.map((item: string) => `→ ${item}`)
                ].join(' ')
              },
              clarity: {
                score: Math.round(evaluation.scores.clarity),
                feedback: [
                  ...evaluation.detailed_feedback.clarity.what_went_well.map((item: string) => `✓ ${item}`),
                  ...evaluation.detailed_feedback.clarity.areas_for_improvement.map((item: string) => `→ ${item}`)
                ].join(' ')
              },
              problem_solving: {
                score: Math.round(evaluation.scores.problem_solving),
                feedback: [
                  ...evaluation.detailed_feedback.problem_solving.what_went_well.map((item: string) => `✓ ${item}`),
                  ...evaluation.detailed_feedback.problem_solving.areas_for_improvement.map((item: string) => `→ ${item}`)
                ].join(' ')
              },
              professionalism: {
                score: Math.round(evaluation.scores.professionalism),
                feedback: [
                  ...evaluation.detailed_feedback.professionalism.what_went_well.map((item: string) => `✓ ${item}`),
                  ...evaluation.detailed_feedback.professionalism.areas_for_improvement.map((item: string) => `→ ${item}`)
                ].join(' ')
              }
            },
            strengths: evaluation.best_practices || [],
            areas_for_improvement: evaluation.improvement_recommendations || [],
            transcript: transcript || [],
            turns_completed: turns_completed || 0
          };

          setTimeout(() => {
            setResults(transformedResults);
            setLoading(false);
          }, 1500);
        }
      } catch (error) {
        console.error('Error loading evaluation results:', error);
        setLoading(false);
      }
    };

    fetchResults();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg animate-pulse">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="font-semibold text-lg">Analyzing Your Performance...</p>
                <p className="text-muted-foreground text-sm mt-2">AI is evaluating your responses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Unable to load results</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild className="gap-2">
              <Link href="/">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <Badge variant="secondary" className="text-sm font-semibold">Training Results</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Overall Score Card */}
        <Card className="mb-8 overflow-hidden border-2">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>

            <div className="relative z-10 text-center">
              <h1 className="text-3xl font-bold mb-2">Session Complete!</h1>
              <p className="text-blue-100 mb-8">Here's how you performed</p>

              <div className="inline-flex flex-col items-center">
                <div className="relative">
                  <svg className="w-48 h-48" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="20"
                      fill="none"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      stroke="white"
                      strokeWidth="20"
                      fill="none"
                      strokeDasharray={`${(results.overall_score / 100) * 502.4} 502.4`}
                      strokeLinecap="round"
                      transform="rotate(-90 100 100)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl font-bold">{results.overall_score}</div>
                      <div className="text-blue-100 text-sm">Overall Score</div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-lg">
                  <span className="text-blue-50">You completed </span>
                  <span className="font-bold">{results.turns_completed} conversation turns</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Problem Resolution Status */}
        <Card className={`mb-8 border-2 ${
          results.problem_resolved
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
            : 'border-red-500 bg-red-50 dark:bg-red-950'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                results.problem_resolved
                  ? 'bg-emerald-500/20'
                  : 'bg-red-500/20'
              }`}>
                {results.problem_resolved ? (
                  <CheckCircle2 className={`w-8 h-8 ${
                    results.problem_resolved ? 'text-emerald-600' : 'text-red-600'
                  }`} />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <h2 className={`text-2xl font-bold mb-2 ${
                  results.problem_resolved ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                }`}>
                  {results.problem_resolved ? 'Problem Resolved' : 'Problem Not Resolved'}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {results.resolution_summary}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competency Scores */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Competency Breakdown</CardTitle>
            <CardDescription>Detailed analysis of your performance across key areas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(results.competencies).map(([key, data], index) => (
              <div key={key}>
                {index > 0 && <Separator className="mb-6" />}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold capitalize">
                      {key.replace('_', ' ')}
                    </h3>
                    <Badge variant={data.score >= 80 ? "default" : data.score >= 70 ? "secondary" : data.score >= 60 ? "outline" : "destructive"} className="text-base px-3 py-1">
                      {data.score}%
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <Progress value={data.score} className="h-3" />

                  <p className="text-muted-foreground text-sm leading-relaxed">{data.feedback}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Strengths & Areas for Improvement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                  <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-xl">Your Strengths</CardTitle>
              </div>
              <CardDescription>Areas where you excelled</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {results.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl">Growth Opportunities</CardTitle>
              </div>
              <CardDescription>Areas to focus on for improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {results.areas_for_improvement.map((area, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{area}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Link href={`/scenarios/${scenarioId}`}>
              Practice This Scenario Again
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="flex-1">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Browse More Scenarios
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

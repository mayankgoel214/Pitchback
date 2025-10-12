'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch evaluation results from localStorage
      const storedData = localStorage.getItem(`evaluation_${sessionId}`);

      if (!storedData) {
        console.error('No evaluation data found for session:', sessionId);
        setLoading(false);
        return;
      }

      const { evaluation, transcript, turns_completed } = JSON.parse(storedData);

      // Transform the evaluation data to match the UI structure
      const transformedResults: EvaluationResult = {
        problem_resolved: evaluation.problem_resolved ?? true, // default to true for old evaluations
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

      // Simulate a brief delay for loading animation
      setTimeout(() => {
        setResults(transformedResults);
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error loading evaluation results:', error);
      setLoading(false);
    }
  }, [sessionId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-100';
    if (score >= 70) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-emerald-600';
    if (score >= 70) return 'from-blue-500 to-blue-600';
    if (score >= 60) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-3xl mb-6 shadow-2xl shadow-[#8B0000]/40 animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-100 font-semibold text-lg">Analyzing Your Performance...</p>
          <p className="text-slate-400 text-sm mt-2">AI is evaluating your responses</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Unable to load results</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-slate-900/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center text-slate-400 hover:text-[#8B0000] transition-colors font-semibold group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-xl shadow-lg shadow-[#8B0000]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-100">Training Results</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Overall Score Card */}
        <div className="bg-gradient-to-br from-[#000814] via-[#001d3d] to-[#003566] rounded-3xl p-10 mb-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

          <div className="relative z-10 text-center">
            <h1 className="text-3xl font-bold mb-2">Session Complete!</h1>
            <p className="text-cyan-100 mb-8">Here's how you performed</p>

            <div className="inline-flex flex-col items-center">
              <div className="relative">
                <svg className="w-48 h-48" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="20"
                    fill="none"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    stroke="url(#gradient)"
                    strokeWidth="20"
                    fill="none"
                    strokeDasharray={`${(results.overall_score / 100) * 502.4} 502.4`}
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold">{results.overall_score}</div>
                    <div className="text-cyan-200 text-sm">Overall Score</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-lg">
                <span className="text-cyan-100">You completed </span>
                <span className="font-bold">{results.turns_completed} conversation turns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Problem Resolution Status */}
        <div className={`rounded-3xl shadow-xl border p-8 mb-8 ${
          results.problem_resolved
            ? 'bg-gradient-to-r from-emerald-900/30 to-emerald-800/30 border-emerald-600'
            : 'bg-gradient-to-r from-red-900/30 to-red-800/30 border-red-600'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-4 rounded-2xl ${
              results.problem_resolved
                ? 'bg-emerald-500/20 border-2 border-emerald-500'
                : 'bg-red-500/20 border-2 border-red-500'
            }`}>
              {results.problem_resolved ? (
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold mb-2 ${
                results.problem_resolved ? 'text-emerald-300' : 'text-red-300'
              }`}>
                {results.problem_resolved ? 'Problem Resolved ✓' : 'Problem Not Resolved'}
              </h2>
              <p className="text-slate-300 leading-relaxed">
                {results.resolution_summary}
              </p>
            </div>
          </div>
        </div>

        {/* Competency Scores */}
        <div className="bg-slate-800 rounded-3xl shadow-xl border border-slate-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Competency Breakdown</h2>

          <div className="space-y-6">
            {Object.entries(results.competencies).map(([key, data]) => (
              <div key={key} className="border-b border-slate-700 pb-6 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-slate-100 capitalize">
                    {key.replace('_', ' ')}
                  </h3>
                  <span className={`px-4 py-2 rounded-xl font-bold text-lg ${getScoreColor(data.score)}`}>
                    {data.score}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full bg-gradient-to-r ${getScoreGradient(data.score)} transition-all duration-1000 rounded-full`}
                    style={{ width: `${data.score}%` }}
                  />
                </div>

                <p className="text-slate-300 text-sm leading-relaxed">{data.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Areas for Improvement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Strengths */}
          <div className="bg-slate-800 rounded-3xl shadow-xl border border-slate-700 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-900/50 rounded-xl border border-emerald-700">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-100">Your Strengths</h2>
            </div>

            <ul className="space-y-3">
              {results.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-300">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-slate-800 rounded-3xl shadow-xl border border-slate-700 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-900/50 rounded-xl border border-blue-700">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-100">Growth Opportunities</h2>
            </div>

            <ul className="space-y-3">
              {results.areas_for_improvement.map((area, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-300">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            href={`/scenarios/${scenarioId}`}
            className="flex-1 py-4 bg-gradient-to-r from-[#8B0000] to-[#6B0000] hover:from-[#6B0000] hover:to-[#5B0000] text-white rounded-xl font-bold text-center transition-all shadow-lg shadow-[#8B0000]/20 hover:shadow-xl hover:shadow-[#8B0000]/30"
          >
            Practice This Scenario Again
          </Link>
          <Link
            href="/"
            className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold text-center transition-all"
          >
            Browse More Scenarios
          </Link>
        </div>
      </main>
    </div>
  );
}

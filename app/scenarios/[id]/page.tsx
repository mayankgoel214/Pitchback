'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import scenarios from '@/data/scenarios.json';
import { Scenario } from '@/lib/types/scenario';

const difficultyColors = {
  beginner: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  intermediate: 'bg-amber-100 text-amber-700 border-amber-200',
  advanced: 'bg-rose-100 text-rose-700 border-rose-200',
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
  const router = useRouter();
  const id = params.id as string;
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const scenarioList = scenarios as Scenario[];
    let found = scenarioList.find((s) => s.id === id);

    // Check custom scenarios from localStorage if not found in default scenarios
    if (!found) {
      const customScenarios = localStorage.getItem('customScenarios');
      if (customScenarios) {
        try {
          const custom = JSON.parse(customScenarios);
          found = custom.find((s: Scenario) => s.id === id);
        } catch (error) {
          console.error('Error loading custom scenario:', error);
        }
      }
    }

    setScenario(found || null);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Scenario not found</p>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-100">HospitalityAI</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#000814] via-[#001d3d] to-[#003566] rounded-3xl p-10 md:p-12 mb-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 mb-4">
                  <svg className="w-4 h-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-sm font-semibold text-cyan-100">
                    {categoryLabels[scenario.category] || scenario.category}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2 leading-tight">
                  {scenario.title}
                </h1>
                <p className="text-cyan-100/80 text-lg">Practice scenario for hospitality training</p>
              </div>
              <span
                className={`px-5 py-3 rounded-xl text-sm font-bold border-2 flex items-center gap-2 ${
                  difficultyColors[scenario.difficulty]
                } shadow-lg backdrop-blur-sm`}
              >
                {scenario.difficulty.charAt(0).toUpperCase() + scenario.difficulty.slice(1)}
              </span>
            </div>

            <div className="flex flex-wrap gap-6 text-base">
              <div className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{scenario.estimated_duration} minutes</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="font-semibold">Up to {scenario.max_turns} turns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scenario Context */}
        <div className="bg-slate-800 rounded-3xl p-8 mb-6 border-2 border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-start gap-5">
            <div className="p-4 bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-2xl flex-shrink-0 shadow-md border border-blue-700">
              <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-100 mb-4">Scenario Context</h3>
              <p className="text-slate-300 leading-relaxed text-base">{scenario.context}</p>
            </div>
          </div>
        </div>

        {/* AI Guest Opening */}
        <div className="bg-slate-800 rounded-3xl p-8 mb-6 border-2 border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-start gap-5">
            <div className="p-4 bg-gradient-to-br from-rose-900/50 to-pink-900/50 rounded-2xl flex-shrink-0 shadow-md border border-rose-700">
              <svg className="w-7 h-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-100 mb-4">
                Guest&apos;s Opening Statement
              </h3>
              <div className="bg-gradient-to-br from-rose-950/50 to-pink-950/50 rounded-2xl p-6 border-l-4 border-rose-500 shadow-inner">
                <p className="text-slate-300 italic text-base leading-relaxed">&quot;{scenario.ai_guest_opening}&quot;</p>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Objectives */}
        <div className="bg-slate-800 rounded-3xl p-8 mb-6 border-2 border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="text-3xl font-bold text-slate-100 mb-6">
            Learning Objectives
          </h2>
          <p className="text-slate-300 mb-6 text-base">
            By completing this scenario, you will be able to:
          </p>
          <ul className="space-y-4">
            {scenario.learning_objectives.map((objective, index) => (
              <li key={index} className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-900/50 to-teal-900/50 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all border border-emerald-700">
                  <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-slate-300 flex-1 pt-2 text-base">{objective}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Evaluation Criteria */}
        <div className="bg-slate-800 rounded-3xl p-8 mb-6 border-2 border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="text-3xl font-bold text-slate-100 mb-6">
            Evaluation Criteria
          </h2>
          <p className="text-slate-300 mb-6 text-base">
            Your performance will be assessed across these key competency areas:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries(scenario.success_criteria).map(([key, criteria]) => (
              <div key={key} className="bg-gradient-to-br from-slate-700 to-slate-800/50 rounded-2xl p-6 border-2 border-slate-600 hover:border-emerald-500 hover:shadow-md transition-all group">
                <h3 className="font-bold text-slate-100 mb-3 capitalize flex items-center gap-3 text-lg">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full group-hover:scale-125 transition-transform"></div>
                  {key.replace('_', ' ')}
                </h3>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">{criteria.description}</p>
                <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-600">
                  <span className="text-slate-400 font-medium">Minimum passing score</span>
                  <span className="font-bold text-emerald-400 text-base">{criteria.min_score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start Practice CTA */}
        <div className="bg-gradient-to-br from-[#8B0000] via-[#6B0000] to-[#5B0000] rounded-3xl p-12 md:p-16 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAtMTRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTE0IDBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl mb-6 shadow-xl">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Begin?
            </h2>
            <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Start your practice session now and engage with realistic AI-powered guest interactions. You can repeat this scenario as many times as needed to master the skills.
            </p>
            <Link
              href={`/scenarios/${scenario.id}/practice`}
              className="inline-flex items-center gap-3 bg-white text-[#8B0000] font-bold py-5 px-10 rounded-2xl hover:bg-slate-50 transition-all shadow-2xl hover:shadow-[#8B0000]/30 hover:scale-105 transform text-lg"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Start Practice Session
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

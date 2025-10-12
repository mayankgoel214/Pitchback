'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ScenarioCard from '@/components/trainee/ScenarioCard';
import ProgressOverview from '@/components/trainee/ProgressOverview';
import RecentSessions from '@/components/trainee/RecentSessions';
import ImprovementAreas from '@/components/trainee/ImprovementAreas';
import ContinueTraining from '@/components/trainee/ContinueTraining';
import { Scenario } from '@/lib/types/scenario';
import { TrainingSession } from '@/lib/types/session';
import { useAuthContext } from '@/lib/contexts/AuthContext';

export default function Home() {
  const [allScenarios, setAllScenarios] = useState<Scenario[]>([]);
  const [userSessions, setUserSessions] = useState<TrainingSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const { employee, isAuthenticated, isLoading, logout } = useAuthContext();
  const router = useRouter();

  // Fetch scenarios from database
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const response = await fetch('/api/scenarios');
        const data = await response.json();

        if (data.success) {
          setAllScenarios(data.data);
        } else {
          console.error('Failed to load scenarios:', data.error);
        }
      } catch (error) {
        console.error('Error fetching scenarios:', error);
      }
    };

    fetchScenarios();
  }, []);

  // Fetch user sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!employee?.id) return;

      try {
        setSessionsLoading(true);
        const response = await fetch(`/api/sessions?trainee_id=${employee.id}`);
        const data = await response.json();

        if (data.success) {
          setUserSessions(data.data);
        } else {
          console.error('Failed to load sessions:', data.error);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchSessions();
  }, [employee?.id]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-3xl mb-6 shadow-2xl shadow-[#8B0000]/40 animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-white font-semibold text-lg">Loading your dashboard...</p>
          <p className="text-slate-400 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-slate-900/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-xl shadow-lg shadow-[#8B0000]/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">
                  HospitalityAI
                </h1>
                <p className="text-xs text-slate-400">
                  AI-Powered Training Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right px-4 py-2 bg-slate-800 rounded-xl border border-slate-700">
                <p className="text-sm font-bold text-slate-100">{employee?.name}</p>
                <p className="text-xs text-slate-400">{employee?.role} • {employee?.department}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#8B0000] to-[#6B0000] hover:from-[#6B0000] hover:to-[#5B0000] rounded-xl transition-all shadow-lg shadow-[#8B0000]/20 hover:shadow-xl hover:shadow-[#8B0000]/30"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Welcome back, {employee?.name?.split(' ')[0]}!
          </h2>
          <p className="text-slate-400">Continue your training journey and improve your hospitality skills</p>
        </div>

        {/* Progress Overview */}
        {!sessionsLoading && (
          <div className="mb-8">
            <ProgressOverview sessions={userSessions} />
          </div>
        )}

        {/* Continue Training Section */}
        {!sessionsLoading && userSessions.some(s => s.status === 'in_progress') && (
          <div className="mb-8">
            <ContinueTraining sessions={userSessions} scenarios={allScenarios} />
          </div>
        )}

        {/* Two Column Layout - Recent Sessions & Improvement Areas */}
        {!sessionsLoading && userSessions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <RecentSessions sessions={userSessions} scenarios={allScenarios} />
            <ImprovementAreas sessions={userSessions} scenarios={allScenarios} />
          </div>
        )}
        {/* Scenarios Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-100 mb-2">
                Available Training Scenarios
              </h2>
              <p className="text-slate-400">Select a scenario to begin your practice session</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700">
                <span className="text-sm font-semibold text-slate-300">{allScenarios.length} scenarios</span>
              </div>
              <Link
                href="/scenarios/create"
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#8B0000] to-[#6B0000] hover:from-[#6B0000] hover:to-[#5B0000] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#8B0000]/20 hover:shadow-xl hover:shadow-[#8B0000]/30"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Scenario
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {allScenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                previousSessions={userSessions}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-slate-400 text-sm">
              © 2025 HospitalityAI Training Platform. Trusted by leading hospitality organizations worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

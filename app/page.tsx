'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ScenarioCard from '@/components/trainee/ScenarioCard';
import { Scenario } from '@/lib/types/scenario';
import { useAuthContext } from '@/lib/contexts/AuthContext';

export default function Home() {
  const [allScenarios, setAllScenarios] = useState<Scenario[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(true);
  const { employee, isAuthenticated, isLoading, logout } = useAuthContext();
  const router = useRouter();

  // Fetch scenarios from database
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        setScenariosLoading(true);
        const response = await fetch('/api/scenarios');
        const data = await response.json();

        if (data.success) {
          setAllScenarios(data.data);
        } else {
          console.error('Failed to load scenarios:', data.error);
        }
      } catch (error) {
        console.error('Error fetching scenarios:', error);
      } finally {
        setScenariosLoading(false);
      }
    };

    fetchScenarios();
  }, []);

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

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#000814] via-[#001d3d] to-[#003566] relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Welcome back, {employee?.name?.split(' ')[0]}!
            </h2>
            <p className="text-xl text-cyan-100 font-light max-w-2xl mx-auto">
              Transform your front desk skills with emotion-aware AI training
            </p>
            <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-md rounded-full border border-cyan-400/30">
              <span className="text-sm font-semibold text-cyan-100">Marriott CodeFest 2025</span>
              <span className="text-xs text-cyan-300/70">•</span>
              <span className="text-sm text-cyan-200/80">From Booking to Belonging</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-cyan-500/20 backdrop-blur-sm rounded-xl border border-cyan-400/30 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-5xl font-bold text-white">{allScenarios.length}</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Training Scenarios</h3>
              <p className="text-sm text-cyan-100/70">Available for practice</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-blue-500/20 backdrop-blur-sm rounded-xl border border-blue-400/30 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-5xl font-bold text-white">5</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Skill Categories</h3>
              <p className="text-sm text-cyan-100/70">Diverse training areas</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-teal-500/20 backdrop-blur-sm rounded-xl border border-teal-400/30 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-white">AI</div>
                </div>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Smart Feedback</h3>
              <p className="text-sm text-cyan-100/70">Powered by advanced AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
              <ScenarioCard key={scenario.id} scenario={scenario} />
            ))}
          </div>
        </div>

        {/* Business Impact Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-br from-emerald-900/40 via-teal-900/40 to-cyan-900/40 backdrop-blur-sm rounded-3xl p-10 md:p-12 border border-emerald-500/20 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-md rounded-full border border-emerald-400/30 mb-4">
                  <span className="text-sm font-bold text-emerald-200">Business Impact</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">Transforming Front Desk Excellence</h3>
                <p className="text-slate-300 text-lg max-w-3xl mx-auto">
                  The journey from <span className="font-semibold text-cyan-300">booking</span> to <span className="font-semibold text-emerald-300">belonging</span> starts at your front desk
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/20 hover:border-emerald-400/40 transition-all group">
                  <div className="text-4xl font-bold text-emerald-300 mb-2">20-40%</div>
                  <div className="text-sm font-semibold text-white mb-1">Guest Satisfaction</div>
                  <div className="text-xs text-slate-400">Determined by front desk</div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-cyan-500/20 hover:border-cyan-400/40 transition-all group">
                  <div className="text-4xl font-bold text-cyan-300 mb-2">$200K+</div>
                  <div className="text-sm font-semibold text-white mb-1">Annual ROI</div>
                  <div className="text-xs text-slate-400">Per 100-employee hotel</div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-teal-500/20 hover:border-teal-400/40 transition-all group">
                  <div className="text-4xl font-bold text-teal-300 mb-2">30%</div>
                  <div className="text-sm font-semibold text-white mb-1">Turnover Reduction</div>
                  <div className="text-xs text-slate-400">With effective training</div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-blue-500/20 hover:border-blue-400/40 transition-all group">
                  <div className="text-4xl font-bold text-blue-300 mb-2">72%</div>
                  <div className="text-sm font-semibold text-white mb-1">Quality Improvement</div>
                  <div className="text-xs text-slate-400">Using AI-powered training</div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/10">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center border border-cyan-400/30">
                    <svg className="w-6 h-6 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-white mb-2">The Critical Moment</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Every day, millions are spent driving bookings. But when guests arrive at your front desk, undertrained staff can break the journey to belonging in seconds. <span className="font-semibold text-emerald-300">Our emotion-aware AI training ensures every interaction builds connection, not friction.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 md:p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

          <div className="relative z-10">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold mb-3">How Training Works</h3>
              <p className="text-slate-300 text-lg">Four simple steps to improve your hospitality skills</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-cyan-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-5 border border-cyan-400/30 group-hover:scale-110 transition-transform">
                  <span className="text-3xl font-bold text-cyan-300">1</span>
                </div>
                <h4 className="font-bold text-lg mb-3">Select Scenario</h4>
                <p className="text-sm text-slate-300 leading-relaxed">Choose from various difficulty levels and categories tailored to your needs</p>
              </div>

              <div className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-blue-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-5 border border-blue-400/30 group-hover:scale-110 transition-transform">
                  <span className="text-3xl font-bold text-blue-300">2</span>
                </div>
                <h4 className="font-bold text-lg mb-3">Practice Live</h4>
                <p className="text-sm text-slate-300 leading-relaxed">Engage with AI guests in realistic, dynamic conversations</p>
              </div>

              <div className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-purple-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-5 border border-purple-400/30 group-hover:scale-110 transition-transform">
                  <span className="text-3xl font-bold text-purple-300">3</span>
                </div>
                <h4 className="font-bold text-lg mb-3">Get Evaluated</h4>
                <p className="text-sm text-slate-300 leading-relaxed">Receive instant AI-powered performance analysis and insights</p>
              </div>

              <div className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-amber-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-5 border border-amber-400/30 group-hover:scale-110 transition-transform">
                  <span className="text-3xl font-bold text-amber-300">4</span>
                </div>
                <h4 className="font-bold text-lg mb-3">Improve Skills</h4>
                <p className="text-sm text-slate-300 leading-relaxed">Learn from feedback and repeat scenarios to master techniques</p>
              </div>
            </div>
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

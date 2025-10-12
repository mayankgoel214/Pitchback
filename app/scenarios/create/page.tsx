'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/lib/contexts/AuthContext';

export default function CreateScenarioPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, token } = useAuthContext();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [context, setContext] = useState('');
  const [aiGuestOpening, setAiGuestOpening] = useState('');
  const [learningObjectives, setLearningObjectives] = useState<string[]>(['']);
  const [estimatedDuration, setEstimatedDuration] = useState(10);
  const [maxTurns, setMaxTurns] = useState(10);
  const [guestPersonality, setGuestPersonality] = useState('');
  const [guestTone, setGuestTone] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'ORGANIZATION' | 'PUBLIC'>('PRIVATE');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const addLearningObjective = () => {
    setLearningObjectives([...learningObjectives, '']);
  };

  const updateLearningObjective = (index: number, value: string) => {
    const updated = [...learningObjectives];
    updated[index] = value;
    setLearningObjectives(updated);
  };

  const removeLearningObjective = (index: number) => {
    setLearningObjectives(learningObjectives.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || !token) {
      setError('You must be logged in to create scenarios');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Create scenario object
      const scenarioData = {
        title,
        description: description || context,
        category,
        difficulty,
        scenarioType: 'general',
        contextBackground: context,
        aiGuestOpening,
        aiGuestPersona: JSON.stringify({
          personality_traits: guestPersonality.split(',').map(t => t.trim()).filter(t => t),
          tone: guestTone,
          speaking_style: '',
          emotion_progression: {
            start: '',
            good_response: '',
            bad_response: '',
            end_goal: ''
          }
        }),
        successCriteria: {
          empathy: {
            description: "Show understanding and empathy",
            min_score: 70,
            keywords: [],
            examples: { good: [], bad: [] }
          },
          clarity: {
            description: "Communicate clearly and effectively",
            min_score: 70,
            requirements: [],
            examples: { good: [], bad: [] }
          },
          problem_solving: {
            description: "Offer practical solutions",
            min_score: 75,
            required_solutions: 2,
            examples: { good: [], bad: [] }
          },
          professionalism: {
            description: "Maintain professional demeanor",
            min_score: 80,
            avoid_phrases: [],
            required_behaviors: [],
            examples: { good: [], bad: [] }
          }
        },
        evaluationRubric: {},
        visibility,
      };

      // Save via API
      const response = await fetch('/api/scenarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(scenarioData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create scenario');
      }

      // Redirect to home
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create scenario');
      console.error('Create scenario error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-slate-900/90">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-100">Create Scenario</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                  step >= s
                    ? 'bg-gradient-to-br from-[#8B0000] to-[#6B0000] text-white shadow-lg'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-2 transition-all ${
                    step > s ? 'bg-[#8B0000]' : 'bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            <span className={step >= 1 ? 'text-slate-100 font-semibold' : 'text-slate-500'}>Basic Details</span>
            <span className={step >= 2 ? 'text-slate-100 font-semibold' : 'text-slate-500'}>Content</span>
            <span className={step >= 3 ? 'text-slate-100 font-semibold' : 'text-slate-500'}>Settings & Privacy</span>
          </div>
        </div>

        {/* Form Steps */}
        <div className="bg-slate-800 rounded-3xl shadow-xl border border-slate-700 p-8">
          {/* Step 1: Basic Details */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-100 mb-6">Scenario Basic Information</h2>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Scenario Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Handling a Billing Dispute"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] outline-none transition-all text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] outline-none transition-all text-slate-100 placeholder:text-slate-500"
                >
                  <option value="">Select category</option>
                  <option value="angry_guests">Angry Guests</option>
                  <option value="language_barriers">Language Barriers</option>
                  <option value="emergencies">Emergencies</option>
                  <option value="special_requests">Special Requests</option>
                  <option value="billing_disputes">Billing Disputes</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-4">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        difficulty === level
                          ? 'border-[#8B0000] bg-red-950/50'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <span className="font-semibold capitalize">{level}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={nextStep}
                disabled={!title || !category}
                className="w-full py-4 bg-gradient-to-r from-[#8B0000] to-[#6B0000] hover:from-[#6B0000] hover:to-[#5B0000] text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Content */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-100 mb-6">Scenario Content</h2>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Context / Situation</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Describe the situation the trainee will encounter..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] outline-none transition-all text-slate-100 placeholder:text-slate-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">AI Guest Opening Line</label>
                <textarea
                  value={aiGuestOpening}
                  onChange={(e) => setAiGuestOpening(e.target.value)}
                  placeholder="What will the AI guest say to start the conversation?"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] outline-none transition-all text-slate-100 placeholder:text-slate-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Learning Objectives</label>
                {learningObjectives.map((obj, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={obj}
                      onChange={(e) => updateLearningObjective(index, e.target.value)}
                      placeholder={`Learning objective ${index + 1}`}
                      className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] outline-none transition-all text-slate-100 placeholder:text-slate-500"
                    />
                    {learningObjectives.length > 1 && (
                      <button
                        onClick={() => removeLearningObjective(index)}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addLearningObjective}
                  className="mt-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-semibold transition-all"
                >
                  + Add Another Objective
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Guest Personality Traits (comma-separated)</label>
                <input
                  type="text"
                  value={guestPersonality}
                  onChange={(e) => setGuestPersonality(e.target.value)}
                  placeholder="e.g., frustrated, tired, professional"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] outline-none transition-all text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Guest Tone</label>
                <select
                  value={guestTone}
                  onChange={(e) => setGuestTone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] outline-none transition-all text-slate-100 placeholder:text-slate-500"
                >
                  <option value="">Select tone</option>
                  <option value="angry">Angry</option>
                  <option value="confused">Confused</option>
                  <option value="polite">Polite</option>
                  <option value="demanding">Demanding</option>
                  <option value="anxious">Anxious</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={prevStep}
                  className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold transition-all"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={!context || !aiGuestOpening || learningObjectives.filter(o => o.trim()).length === 0}
                  className="flex-1 py-4 bg-gradient-to-r from-[#8B0000] to-[#6B0000] hover:from-[#6B0000] hover:to-[#5B0000] text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Settings & Privacy */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-100 mb-6">Final Settings & Privacy</h2>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">Who can access this scenario?</label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setVisibility('PRIVATE')}
                    className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                      visibility === 'PRIVATE'
                        ? 'border-[#8B0000] bg-red-950/50'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <svg className="w-6 h-6 text-slate-300 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <div>
                        <div className="font-bold text-slate-100 mb-1">Private (Only Me)</div>
                        <div className="text-sm text-slate-400">Only you can see and use this scenario</div>
                      </div>
                    </div>
                  </button>

                  {user?.isOrgAdmin && (
                    <button
                      type="button"
                      onClick={() => setVisibility('ORGANIZATION')}
                      className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                        visibility === 'ORGANIZATION'
                          ? 'border-[#8B0000] bg-red-950/50'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <svg className="w-6 h-6 text-slate-300 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <div>
                          <div className="font-bold text-slate-100 mb-1">Organization (Admin Only)</div>
                          <div className="text-sm text-slate-400">All members of {user.organization?.name} can see and use this scenario</div>
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setVisibility('PUBLIC')}
                    className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                      visibility === 'PUBLIC'
                        ? 'border-[#8B0000] bg-red-950/50'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <svg className="w-6 h-6 text-slate-300 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="font-bold text-slate-100 mb-1">Public (Everyone)</div>
                        <div className="text-sm text-slate-400">Anyone can see and use this scenario</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-950/50 border-l-4 border-red-500 p-4 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="ml-3 text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={prevStep}
                  className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-gradient-to-r from-[#8B0000] to-[#6B0000] hover:from-[#6B0000] hover:to-[#5B0000] text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    'Create Scenario'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

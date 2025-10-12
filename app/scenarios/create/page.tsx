'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateScenarioPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form state
  const [creatorRole, setCreatorRole] = useState<'manager' | 'admin' | ''>('');
  const [creatorName, setCreatorName] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [context, setContext] = useState('');
  const [aiGuestOpening, setAiGuestOpening] = useState('');
  const [learningObjectives, setLearningObjectives] = useState<string[]>(['']);
  const [estimatedDuration, setEstimatedDuration] = useState(10);
  const [maxTurns, setMaxTurns] = useState(10);
  const [guestPersonality, setGuestPersonality] = useState('');
  const [guestTone, setGuestTone] = useState('');
  const [saveOption, setSaveOption] = useState<'train' | 'save'>('save');

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
    // Create scenario object
    const scenario = {
      id: `custom-${Date.now()}`,
      title,
      category,
      difficulty,
      context,
      ai_guest_opening: aiGuestOpening,
      learning_objectives: learningObjectives.filter(obj => obj.trim() !== ''),
      estimated_duration: estimatedDuration,
      max_turns: maxTurns,
      is_global: false,
      is_custom: true,
      created_by: creatorName,
      creator_role: creatorRole,
      guest_persona: {
        personality_traits: guestPersonality.split(',').map(t => t.trim()),
        tone: guestTone,
        speaking_style: '',
        emotion_progression: {
          start: '',
          good_response: '',
          bad_response: '',
          end_goal: ''
        },
        custom_instructions: ''
      },
      success_criteria: {
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      save_option: saveOption
    };

    // Save to localStorage
    const existingScenarios = localStorage.getItem('customScenarios');
    const scenarios = existingScenarios ? JSON.parse(existingScenarios) : [];
    scenarios.push(scenario);
    localStorage.setItem('customScenarios', JSON.stringify(scenarios));

    // Redirect to home
    router.push('/');
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

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
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                  step >= s
                    ? 'bg-gradient-to-br from-[#8B0000] to-[#6B0000] text-white shadow-lg'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {s}
                </div>
                {s < 4 && (
                  <div className={`flex-1 h-1 mx-2 transition-all ${
                    step > s ? 'bg-[#8B0000]' : 'bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            <span className={step >= 1 ? 'text-slate-100 font-semibold' : 'text-slate-500'}>Creator Info</span>
            <span className={step >= 2 ? 'text-slate-100 font-semibold' : 'text-slate-500'}>Basic Details</span>
            <span className={step >= 3 ? 'text-slate-100 font-semibold' : 'text-slate-500'}>Content</span>
            <span className={step >= 4 ? 'text-slate-100 font-semibold' : 'text-slate-500'}>Settings</span>
          </div>
        </div>

        {/* Form Steps */}
        <div className="bg-slate-800 rounded-3xl shadow-xl border border-slate-700 p-8">
          {/* Step 1: Creator Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-100 mb-6">Who is creating this scenario?</h2>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Your Name</label>
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] outline-none transition-all text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">Your Role</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setCreatorRole('manager')}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      creatorRole === 'manager'
                        ? 'border-[#8B0000] bg-red-950/50'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-semibold text-slate-100">Manager</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatorRole('admin')}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      creatorRole === 'admin'
                        ? 'border-[#8B0000] bg-red-950/50'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="font-semibold text-slate-100">Admin</span>
                    </div>
                  </button>
                </div>
              </div>

              <button
                onClick={nextStep}
                disabled={!creatorName || !creatorRole}
                className="w-full py-4 bg-gradient-to-r from-[#8B0000] to-[#6B0000] hover:from-[#6B0000] hover:to-[#5B0000] text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Basic Details */}
          {step === 2 && (
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

              <div className="flex gap-4">
                <button
                  onClick={prevStep}
                  className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold transition-all"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={!title || !category}
                  className="flex-1 py-4 bg-gradient-to-r from-[#8B0000] to-[#6B0000] hover:from-[#6B0000] hover:to-[#5B0000] text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Content */}
          {step === 3 && (
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

          {/* Step 4: Settings */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-100 mb-6">Final Settings</h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Estimated Duration (minutes)</label>
                  <input
                    type="number"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(parseInt(e.target.value))}
                    min="5"
                    max="60"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] outline-none transition-all text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Maximum Conversation Turns</label>
                  <input
                    type="number"
                    value={maxTurns}
                    onChange={(e) => setMaxTurns(parseInt(e.target.value))}
                    min="5"
                    max="20"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] outline-none transition-all text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">What would you like to do with this scenario?</label>
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setSaveOption('save')}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                      saveOption === 'save'
                        ? 'border-[#8B0000] bg-red-950/50'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <svg className="w-6 h-6 text-slate-300 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      <div>
                        <div className="font-bold text-slate-100 mb-1">Save for Future Use</div>
                        <div className="text-sm text-slate-400">Save this scenario to the library for employees to practice later</div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSaveOption('train')}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                      saveOption === 'train'
                        ? 'border-[#8B0000] bg-red-950/50'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <svg className="w-6 h-6 text-slate-300 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <div>
                        <div className="font-bold text-slate-100 mb-1">Train AI & Save</div>
                        <div className="text-sm text-slate-400">Train the AI with this scenario immediately and add it to the library</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={prevStep}
                  className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-4 bg-gradient-to-r from-[#8B0000] to-[#6B0000] hover:from-[#6B0000] hover:to-[#5B0000] text-white rounded-xl font-bold transition-all shadow-lg"
                >
                  Create Scenario
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

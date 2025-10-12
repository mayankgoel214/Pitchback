'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle, ArrowLeft, Plus, X, Lock, Users, Globe } from 'lucide-react';

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
    return (
      <div className="min-h-screen bg-slate-950">
        <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
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
            <Button
              variant="ghost"
              asChild
              className="text-slate-400 hover:text-[#8B0000] transition-colors font-semibold"
            >
              <Link href="/" className="flex items-center">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-xl shadow-lg shadow-[#8B0000]/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-100">Create Scenario</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Progress Steps */}
        <div className="mb-10">
          <Progress value={(step / 3) * 100} className="mb-6 h-2" />
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
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-8">
            {/* Step 1: Basic Details */}
            {step === 1 && (
              <div className="space-y-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl text-slate-100">Scenario Basic Information</CardTitle>
                  <CardDescription className="text-slate-400">Set up the foundational details for your training scenario</CardDescription>
                </CardHeader>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-300 font-semibold">Scenario Title</Label>
                  <Input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Handling a Billing Dispute"
                    className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-[#8B0000]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-slate-300 font-semibold">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" className="bg-slate-700 border-slate-600 text-slate-100 focus:ring-[#8B0000]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="angry_guests">Angry Guests</SelectItem>
                      <SelectItem value="language_barriers">Language Barriers</SelectItem>
                      <SelectItem value="emergencies">Emergencies</SelectItem>
                      <SelectItem value="special_requests">Special Requests</SelectItem>
                      <SelectItem value="billing_disputes">Billing Disputes</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-300 font-semibold">Difficulty Level</Label>
                  <RadioGroup value={difficulty} onValueChange={(value) => setDifficulty(value as 'beginner' | 'intermediate' | 'advanced')}>
                    <div className="grid grid-cols-3 gap-4">
                      {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                        <Label
                          key={level}
                          htmlFor={level}
                          className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            difficulty === level
                              ? 'border-[#8B0000] bg-red-950/50 text-slate-100'
                              : 'border-slate-600 hover:border-slate-500 text-slate-300'
                          }`}
                        >
                          <RadioGroupItem value={level} id={level} className="sr-only" />
                          <span className="font-semibold capitalize">{level}</span>
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  onClick={nextStep}
                  disabled={!title || !category}
                  className="w-full bg-gradient-to-r from-[#8B0000] to-[#6B0000] hover:from-[#6B0000] hover:to-[#5B0000] text-white font-bold h-12"
                >
                  Continue
                </Button>
              </div>
            )}

          {/* Step 2: Content */}
          {step === 2 && (
            <div className="space-y-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl text-slate-100">Scenario Content</CardTitle>
                <CardDescription className="text-slate-400">Define the scenario details and AI guest behavior</CardDescription>
              </CardHeader>

              <div className="space-y-2">
                <Label htmlFor="context" className="text-slate-300 font-semibold">Context / Situation</Label>
                <Textarea
                  id="context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Describe the situation the trainee will encounter..."
                  rows={4}
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-[#8B0000] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiOpening" className="text-slate-300 font-semibold">AI Guest Opening Line</Label>
                <Textarea
                  id="aiOpening"
                  value={aiGuestOpening}
                  onChange={(e) => setAiGuestOpening(e.target.value)}
                  placeholder="What will the AI guest say to start the conversation?"
                  rows={3}
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-[#8B0000] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 font-semibold">Learning Objectives</Label>
                {learningObjectives.map((obj, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      type="text"
                      value={obj}
                      onChange={(e) => updateLearningObjective(index, e.target.value)}
                      placeholder={`Learning objective ${index + 1}`}
                      className="flex-1 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-[#8B0000]"
                    />
                    {learningObjectives.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeLearningObjective(index)}
                        className="shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addLearningObjective}
                  className="mt-2 bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600 hover:text-slate-100"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Objective
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="personality" className="text-slate-300 font-semibold">Guest Personality Traits (comma-separated)</Label>
                <Input
                  id="personality"
                  type="text"
                  value={guestPersonality}
                  onChange={(e) => setGuestPersonality(e.target.value)}
                  placeholder="e.g., frustrated, tired, professional"
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-[#8B0000]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone" className="text-slate-300 font-semibold">Guest Tone</Label>
                <Select value={guestTone} onValueChange={setGuestTone}>
                  <SelectTrigger id="tone" className="bg-slate-700 border-slate-600 text-slate-100 focus:ring-[#8B0000]">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="angry">Angry</SelectItem>
                    <SelectItem value="confused">Confused</SelectItem>
                    <SelectItem value="polite">Polite</SelectItem>
                    <SelectItem value="demanding">Demanding</SelectItem>
                    <SelectItem value="anxious">Anxious</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600 hover:text-slate-100 h-12"
                >
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!context || !aiGuestOpening || learningObjectives.filter(o => o.trim()).length === 0}
                  className="flex-1 bg-gradient-to-r from-[#8B0000] to-[#6B0000] hover:from-[#6B0000] hover:to-[#5B0000] text-white font-bold h-12"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Settings & Privacy */}
          {step === 3 && (
            <div className="space-y-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl text-slate-100">Final Settings & Privacy</CardTitle>
                <CardDescription className="text-slate-400">Choose who can access your scenario</CardDescription>
              </CardHeader>

              <div className="space-y-3">
                <Label className="text-slate-300 font-semibold">Who can access this scenario?</Label>
                <RadioGroup value={visibility} onValueChange={(value) => setVisibility(value as 'PRIVATE' | 'ORGANIZATION' | 'PUBLIC')}>
                  <Label
                    htmlFor="private"
                    className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer ${
                      visibility === 'PRIVATE'
                        ? 'border-[#8B0000] bg-red-950/50'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <RadioGroupItem value="PRIVATE" id="private" className="mt-1" />
                    <Lock className="w-6 h-6 text-slate-300 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold text-slate-100 mb-1">Private (Only Me)</div>
                      <div className="text-sm text-slate-400">Only you can see and use this scenario</div>
                    </div>
                  </Label>

                  {user?.isOrgAdmin && (
                    <Label
                      htmlFor="organization"
                      className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer ${
                        visibility === 'ORGANIZATION'
                          ? 'border-[#8B0000] bg-red-950/50'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <RadioGroupItem value="ORGANIZATION" id="organization" className="mt-1" />
                      <Users className="w-6 h-6 text-slate-300 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-bold text-slate-100 mb-1">Organization (Admin Only)</div>
                        <div className="text-sm text-slate-400">All members of {user.organization?.name} can see and use this scenario</div>
                      </div>
                    </Label>
                  )}

                  <Label
                    htmlFor="public"
                    className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer ${
                      visibility === 'PUBLIC'
                        ? 'border-[#8B0000] bg-red-950/50'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <RadioGroupItem value="PUBLIC" id="public" className="mt-1" />
                    <Globe className="w-6 h-6 text-slate-300 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold text-slate-100 mb-1">Public (Everyone)</div>
                      <div className="text-sm text-slate-400">Anyone can see and use this scenario</div>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600 hover:text-slate-100 h-12"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-[#8B0000] to-[#6B0000] hover:from-[#6B0000] hover:to-[#5B0000] text-white font-bold h-12"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Scenario'
                  )}
                </Button>
              </div>
            </div>
          )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

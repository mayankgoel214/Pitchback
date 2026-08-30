'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Scenario } from '@/lib/types/scenario';
import { ConversationMessage } from '@/lib/types/session';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  MessageCircle,
  User,
  Info,
  Lightbulb,
  Clock,
  Eye,
  EyeOff,
  Mic,
  Square,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Menu,
  X,
  ArrowLeft
} from 'lucide-react';

export default function PracticeSessionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user: employee, token } = useAuthContext();

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(true);

  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isEndingSession, setIsEndingSession] = useState(false);

  // Voice interaction states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');

  // Drawer states
  const [showConversationDrawer, setShowConversationDrawer] = useState(false);
  const [showInsightsDrawer, setShowInsightsDrawer] = useState(false);

  // Advanced AI tracking states
  const [emotionContext, setEmotionContext] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isManuallyStoppingRef = useRef(false);
  const isListeningRef = useRef(false);
  const currentTranscriptRef = useRef<string>('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // Fetch scenario from database
  useEffect(() => {
    const fetchScenario = async () => {
      try {
        setScenarioLoading(true);
        const headers: HeadersInit = {};

        // Add Authorization header if user is authenticated
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/scenarios/${id}`, { headers });
        const data = await response.json();

        if (data.success) {
          setScenario(data.data);
        } else {
          console.error('Failed to load scenario:', data.error);
        }
      } catch (error) {
        console.error('Error fetching scenario:', error);
      } finally {
        setScenarioLoading(false);
      }
    };

    fetchScenario();
  }, [id, token]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          const transcript = finalTranscript || interimTranscript;
          setCurrentTranscript(transcript);
          currentTranscriptRef.current = transcript;
        };

        recognition.onerror = (event: any) => {
          // If we're manually stopping, ignore the error - it's expected
          if (isManuallyStoppingRef.current) {
            return;
          }

          console.error('Speech recognition error:', event.error);

          // Don't automatically restart on error
          if (recognitionRef.current && isListeningRef.current) {
            try {
              recognitionRef.current.abort();
            } catch (e) {
              // Ignore
            }
          }
          isListeningRef.current = false;
          setIsListening(false);
        };

        recognition.onend = () => {
          // If we're still in listening state and didn't manually stop,
          // restart the recognition (for continuous listening)
          if (!isManuallyStoppingRef.current && isListeningRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error('Failed to restart recognition:', error);
              isListeningRef.current = false;
              setIsListening(false);
            }
          } else {
            isListeningRef.current = false;
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        isManuallyStoppingRef.current = true;
        try {
          recognitionRef.current.abort();
        } catch (error) {
          console.error('Failed to abort recognition on cleanup:', error);
        }
      }
    };
  }, []);

  // Removed auto-initialization to prevent browser autoplay blocking
  // User must click "Start Session" button to begin

  const initializeSession = async () => {
    if (!scenario) return;

    // Only create a database session if user is logged in
    if (employee) {
      try {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario_id: scenario.id,
            trainee_id: employee.id,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setSessionId(data.data.id);
        }
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    }

    const openingMessage: ConversationMessage = {
      turn: 0,
      speaker: 'ai_guest',
      text: scenario.ai_guest_opening,
      timestamp: new Date().toISOString(),
    };

    setConversation([openingMessage]);
    setSessionStarted(true);

    // Speak the opening message
    await speakText(scenario.ai_guest_opening);
  };

  // Play TTS audio with fallback to browser speech
  const speakText = async (text: string) => {
    setIsSpeaking(true);
    try {
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: 'nova', // Female voice for guest
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioRef.current) {
          audioRef.current.pause();
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };

        await audio.play();
      } else {
        // Fallback to browser's Web Speech API if OpenAI TTS fails
        console.log('OpenAI TTS failed, using browser speech synthesis as fallback');
        useBrowserSpeech(text);
      }
    } catch (error) {
      console.error('Failed to play TTS:', error);
      // Fallback to browser's Web Speech API
      useBrowserSpeech(text);
    }
  };

  // Fallback: Use browser's built-in speech synthesis
  const useBrowserSpeech = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Configure voice (prefer female voice)
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice =>
        voice.name.includes('Female') ||
        voice.name.includes('female') ||
        voice.name.includes('Samantha') ||
        voice.name.includes('Victoria') ||
        voice.lang.startsWith('en')
      );

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.rate = 0.95; // Slightly slower for clarity
      utterance.pitch = 1.1; // Slightly higher pitch
      utterance.volume = 1.0;

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Speech synthesis not supported');
      setIsSpeaking(false);
    }
  };

  // Start listening to trainee
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListeningRef.current) {
      setCurrentTranscript('');
      currentTranscriptRef.current = '';
      isManuallyStoppingRef.current = false;
      try {
        recognitionRef.current.start();
        isListeningRef.current = true;
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start recognition:', error);
        isListeningRef.current = false;
      }
    }
  }, []);

  // Handle voice message from trainee
  const handleVoiceMessage = useCallback(async (message: string) => {
    if (!scenario) return;

    const traineeMessage: ConversationMessage = {
      turn: turnCount + 1,
      speaker: 'trainee',
      text: message,
      timestamp: new Date().toISOString(),
    };

    setConversation((prev) => [...prev, traineeMessage]);
    setCurrentTranscript('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          conversation_history: conversation,
          trainee_message: message,
          emotion_context: emotionContext, // Pass emotion context for continuity
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: ConversationMessage = {
          turn: turnCount + 1,
          speaker: 'ai_guest',
          text: data.data.ai_response,
          timestamp: new Date().toISOString(),
        };

        setConversation((prev) => [...prev, aiMessage]);
        setTurnCount((prev) => prev + 1);

        // Update emotion context from AI response
        setEmotionContext(data.data.emotion_context);
        setAiInsights(data.data.ai_insights);

        // Speak the AI response
        await speakText(data.data.ai_response);

        // Auto-end session after 10 turns if max_turns not specified
        const maxTurns = 10;
        if (turnCount + 1 >= maxTurns) {
          setTimeout(() => endSession(), 2000);
        }
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
    } finally {
      setIsLoading(false);
    }
  }, [scenario, turnCount, conversation, emotionContext]);

  // Stop listening and process the message
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      isManuallyStoppingRef.current = true;
      isListeningRef.current = false;

      // Save the transcript before aborting - read from ref to avoid stale closure
      const finalTranscript = currentTranscriptRef.current.trim();

      try {
        // Use abort() instead of stop() to immediately terminate recognition
        // abort() doesn't trigger onend or send final results
        recognitionRef.current.abort();
      } catch (error) {
        console.error('Failed to abort recognition:', error);
      }

      setIsListening(false);
      setCurrentTranscript('');
      currentTranscriptRef.current = '';

      if (finalTranscript) {
        handleVoiceMessage(finalTranscript);
      }

      // Reset the flag after a short delay
      setTimeout(() => {
        isManuallyStoppingRef.current = false;
      }, 100);
    }
  }, [handleVoiceMessage]);

  // Toggle listening - uses ref to avoid stale closure issues
  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  const endSession = async () => {
    if (!scenario) return;

    // Set loading state immediately
    setIsEndingSession(true);

    try {
      // Only update session in database if user is logged in
      if (sessionId) {
        await fetch(`/api/sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_history: conversation,
            turns_completed: turnCount,
            status: 'completed',
          }),
        });
      }

      const evaluationResponse = await fetch('/api/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId || 'guest-session',
          scenario,
          transcript: conversation,
        }),
      });

      const evaluationData = await evaluationResponse.json();

      // Store evaluation results in localStorage for the results page
      if (evaluationData.success && typeof window !== 'undefined') {
        const tempSessionId = sessionId || `guest-${Date.now()}`;
        const resultsData = {
          evaluation: evaluationData.data,
          transcript: conversation,
          turns_completed: turnCount,
          sessionId: tempSessionId
        };
        localStorage.setItem(`evaluation_${tempSessionId}`, JSON.stringify(resultsData));

        // Redirect to results page
        router.push(`/scenarios/${scenario.id}/results?sessionId=${tempSessionId}`);
      } else {
        // If evaluation failed, show error and reset loading state
        console.error('Evaluation failed:', evaluationData.error);
        setIsEndingSession(false);
      }
    } catch (error) {
      console.error('Failed to end session:', error);
      setIsEndingSession(false);
    }
  };


  if (scenarioLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Skeleton className="h-8 w-64" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 lg:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </main>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Scenario Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The requested scenario could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show start session screen before session begins
  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-3xl">{scenario.title}</CardTitle>
                <CardDescription className="text-base">
                  {scenario.description}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm">
                {scenario.category}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                ~10 turns
              </Badge>
              <Badge variant="outline" className={
                scenario.difficulty === 'beginner' ? 'border-green-500 text-green-600' :
                scenario.difficulty === 'intermediate' ? 'border-yellow-500 text-yellow-600' :
                'border-red-500 text-red-600'
              }>
                {scenario.difficulty}
              </Badge>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Scenario Context
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {scenario.context_background}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-600">
                <MessageCircle className="w-4 h-4" />
                How It Works
              </h3>
              <ul className="text-sm space-y-1 text-blue-900 dark:text-blue-100">
                <li>• The AI guest will start the conversation</li>
                <li>• Click the microphone button to speak your response</li>
                <li>• The AI will respond based on how you handle the situation</li>
                <li>• Session ends after ~10 turns or when you click &quot;End Session&quot;</li>
              </ul>
            </div>

            <div className="flex flex-col items-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={initializeSession}
                className="w-full max-w-sm h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              >
                <Mic className="w-6 h-6 mr-2" />
                Start Session
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Make sure your microphone is enabled and your volume is up
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col relative overflow-hidden">
      {/* Minimal Translucent Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Link>
            </Button>
            <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
              {scenario.title}
            </Badge>
            <Badge variant="secondary" className="hidden sm:inline-flex bg-muted/50 backdrop-blur-sm">
              <Info className="w-3 h-3 mr-1" />
              {scenario.category}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-background/50 backdrop-blur-sm rounded-full border border-border/40">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold">{turnCount}</span>
              <span className="text-xs text-muted-foreground">/ 10</span>
            </div>
            <Button
              onClick={endSession}
              variant="destructive"
              size="sm"
              className="font-bold"
              disabled={isEndingSession}
            >
              {isEndingSession ? 'Ending...' : 'End Session'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Centered Full Screen */}
      <main className="flex-1 flex items-center justify-center pt-20 pb-32 px-4">
        <div className="relative w-full max-w-2xl">
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 -z-10">
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl transition-all duration-1000 ${
              aiInsights?.current_emotion?.includes('angry')
                ? 'bg-red-500/20 animate-pulse'
                : aiInsights?.current_emotion?.includes('calm')
                ? 'bg-emerald-500/20'
                : 'bg-blue-500/20'
            }`}></div>
            <div className={`absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl transition-all duration-1000 ${
              isSpeaking ? 'bg-indigo-500/20 animate-pulse' : 'bg-indigo-500/10'
            }`}></div>
          </div>

          {/* Floating AI Metrics - Above Avatar */}
          {aiInsights && (
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-md">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {/* Emotion Badge */}
                <Card className="bg-background/60 backdrop-blur-xl border-border/40 shadow-lg">
                  <CardContent className="px-4 py-2 flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      aiInsights.current_emotion?.includes('angry') ? 'bg-red-500 animate-pulse' :
                      aiInsights.current_emotion?.includes('frustrated') ? 'bg-orange-500' :
                      aiInsights.current_emotion?.includes('calm') || aiInsights.current_emotion?.includes('satisfied') ? 'bg-green-500' :
                      aiInsights.current_emotion?.includes('happy') ? 'bg-emerald-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <span className="text-xs font-bold capitalize">
                      {aiInsights.current_emotion?.replace(/_/g, ' ') || 'Neutral'}
                    </span>
                  </CardContent>
                </Card>

                {/* Escalation Level */}
                <Card className="bg-background/60 backdrop-blur-xl border-border/40 shadow-lg">
                  <CardContent className="px-4 py-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-bold">{aiInsights.escalation_level}%</span>
                  </CardContent>
                </Card>

                {/* Performance Score */}
                <Card className="bg-background/60 backdrop-blur-xl border-border/40 shadow-lg">
                  <CardContent className="px-4 py-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold">{Math.round(aiInsights.trainee_performance)}%</span>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Center Stage - Large Avatar */}
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Guest Speech Bubble */}
            {isSpeaking && conversation.length > 0 && (
              <Card className="bg-background/80 backdrop-blur-xl border-border/40 shadow-2xl max-w-lg animate-in fade-in slide-in-from-bottom-4">
                <CardContent className="pt-4">
                  <p className="text-sm leading-relaxed">
                    {conversation[conversation.length - 1]?.speaker === 'ai_guest'
                      ? conversation[conversation.length - 1]?.text
                      : scenario.ai_guest_opening}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Avatar */}
            <div className="relative">
              <Avatar className={`w-80 h-80 transition-all duration-500 ${
                isSpeaking
                  ? 'ring-8 ring-blue-600/50 shadow-2xl shadow-blue-500/50 scale-105'
                  : isLoading
                  ? 'ring-8 ring-indigo-600/50 shadow-2xl shadow-indigo-500/30 animate-pulse'
                  : 'ring-4 ring-border/40 shadow-xl'
              }`}>
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                  <User className={`w-40 h-40 transition-all duration-500 ${
                    isSpeaking ? 'scale-110' : ''
                  }`} />
                </AvatarFallback>
              </Avatar>

              {/* Status Badge Below Avatar */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                {isSpeaking && (
                  <Badge className="px-5 py-2 bg-blue-600 hover:bg-blue-600 text-white font-semibold shadow-xl flex items-center gap-2 animate-pulse">
                    <div className="flex gap-1">
                      <div className="w-1 h-3 bg-white rounded-full animate-bounce"></div>
                      <div className="w-1 h-3 bg-white rounded-full animate-bounce delay-100"></div>
                      <div className="w-1 h-3 bg-white rounded-full animate-bounce delay-200"></div>
                    </div>
                    <span>Speaking...</span>
                  </Badge>
                )}
                {isLoading && !isSpeaking && (
                  <Badge className="px-5 py-2 bg-indigo-600 hover:bg-indigo-600 text-white font-semibold shadow-xl">
                    Thinking...
                  </Badge>
                )}
                {!isSpeaking && !isLoading && !isListening && (
                  <Badge variant="outline" className="px-5 py-2 font-semibold shadow-xl bg-background/80 backdrop-blur-sm">
                    Ready to listen
                  </Badge>
                )}
                {isListening && (
                  <Badge className="px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-xl animate-pulse">
                    Listening...
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Control Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border/40 pb-safe">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Live Transcript Display - Above Mic */}
          {isListening && currentTranscript && (
            <Card className="mb-4 border-2 border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
              <CardContent className="pt-4">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                  You&apos;re saying:
                </p>
                <p className="text-sm font-medium">{currentTranscript}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-center gap-6">
            {/* Left Toggle - Conversation */}
            <Button
              onClick={() => setShowConversationDrawer(true)}
              variant="outline"
              size="lg"
              className="rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>

            {/* Center Mic Button - Hero Element */}
            <div className="relative">
              <Button
                onClick={toggleListening}
                disabled={isSpeaking || isLoading}
                size="lg"
                className={`w-24 h-24 rounded-full font-bold transition-all shadow-2xl relative ${
                  isListening
                    ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/50 animate-pulse scale-110'
                    : 'bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:scale-110 shadow-blue-600/50'
                }`}
              >
                {isListening ? (
                  <Square className="w-12 h-12" />
                ) : (
                  <Mic className="w-12 h-12" />
                )}
              </Button>

              {/* Waveform Animation Ring */}
              {isListening && (
                <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping pointer-events-none"></div>
              )}
            </div>

            {/* Right Toggle - AI Insights */}
            <Button
              onClick={() => setShowInsightsDrawer(true)}
              variant="outline"
              size="lg"
              className="rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 border-blue-600 text-blue-600"
            >
              <Lightbulb className="w-5 h-5" />
            </Button>
          </div>

          {/* Helper Text */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            {isListening ? 'Tap to stop recording' : 'Tap microphone to speak'}
          </p>
        </div>
      </div>

      {/* Conversation Drawer - Right Side */}
      <Sheet open={showConversationDrawer} onOpenChange={setShowConversationDrawer}>
        <SheetContent side="right" className="w-full sm:w-96 p-0">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Conversation History
            </SheetTitle>
            <SheetDescription>
              Full transcript of your training session
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
            {conversation.map((message, index) => (
              <div key={index} className={`${
                message.speaker === 'trainee' ? 'text-right' : 'text-left'
              }`}>
                <div className={`inline-block max-w-[85%] rounded-xl px-4 py-2 ${
                  message.speaker === 'trainee'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted border'
                }`}>
                  <p className={`text-xs font-semibold mb-1 ${
                    message.speaker === 'trainee' ? 'text-emerald-100' : 'text-muted-foreground'
                  }`}>
                    {message.speaker === 'trainee' ? 'You' : 'Guest'}
                  </p>
                  <p className="text-sm">{message.text}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 px-1">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </SheetContent>
      </Sheet>

      {/* AI Insights Drawer - Left Side */}
      <Sheet open={showInsightsDrawer} onOpenChange={setShowInsightsDrawer}>
        <SheetContent side="left" className="w-full sm:w-96 p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                AI Insights
              </SheetTitle>
              <Badge className="bg-blue-600 hover:bg-blue-600 text-white">LIVE</Badge>
            </div>
            <SheetDescription>
              Real-time performance analysis and tips
            </SheetDescription>
          </SheetHeader>

          {aiInsights ? (
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Guest Emotion State */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <p className="text-xs font-bold text-muted-foreground mb-2">GUEST EMOTIONAL STATE</p>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        aiInsights.current_emotion?.includes('angry') ? 'bg-red-500 animate-pulse' :
                        aiInsights.current_emotion?.includes('frustrated') ? 'bg-orange-500' :
                        aiInsights.current_emotion?.includes('calm') || aiInsights.current_emotion?.includes('satisfied') ? 'bg-green-500' :
                        aiInsights.current_emotion?.includes('happy') ? 'bg-emerald-500' :
                        'bg-yellow-500'
                      }`}></div>
                      <p className="text-base font-bold capitalize">
                        {aiInsights.current_emotion?.replace(/_/g, ' ') || 'Neutral'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Escalation Meter */}
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-xs font-bold text-muted-foreground mb-2">ESCALATION LEVEL</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Current</span>
                        <span className="font-bold">{aiInsights.escalation_level}/100</span>
                      </div>
                      <Progress
                        value={aiInsights.escalation_level}
                        className={`h-2.5 ${
                          aiInsights.escalation_level >= 70 ? '[&>div]:bg-gradient-to-r [&>div]:from-red-600 [&>div]:to-red-500' :
                          aiInsights.escalation_level >= 40 ? '[&>div]:bg-gradient-to-r [&>div]:from-orange-600 [&>div]:to-orange-500' :
                          '[&>div]:bg-gradient-to-r [&>div]:from-green-600 [&>div]:to-green-500'
                        }`}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* De-escalation Progress */}
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-xs font-bold text-muted-foreground mb-2">DE-ESCALATION PROGRESS</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{Math.round(aiInsights.de_escalation_progress)}/100</span>
                      </div>
                      <Progress
                        value={aiInsights.de_escalation_progress}
                        className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-emerald-600 [&>div]:to-emerald-500"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Trainee Performance Score */}
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-xs font-bold text-muted-foreground mb-2">YOUR PERFORMANCE</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`text-3xl font-bold ${
                          aiInsights.trainee_performance >= 70 ? 'text-green-600 dark:text-green-400' :
                          aiInsights.trainee_performance >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {Math.round(aiInsights.trainee_performance)}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">out of 100</p>
                          <p className="text-sm font-semibold">
                            {aiInsights.trainee_performance >= 70 ? 'Excellent' :
                             aiInsights.trainee_performance >= 50 ? 'Good' : 'Needs Work'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Real-time Tips */}
                {aiInsights.escalation_level > 50 && (
                  <Card className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-600/50">
                    <CardContent className="pt-4">
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        SUGGESTION
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-200">
                        Guest is still escalated. Try showing more empathy and offering concrete solutions.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {aiInsights.de_escalation_progress > 60 && (
                  <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-600/50">
                    <CardContent className="pt-4">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        GREAT JOB!
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-200">
                        You&apos;re doing well! The guest is calming down. Keep up the professional approach.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Pro Tips */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-4">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      PRO TIP
                    </p>
                    <p className="text-xs leading-relaxed">
                      <strong>Demonstrate empathy</strong>, communicate clearly, <strong>offer practical solutions</strong>, and maintain professionalism throughout the interaction. Listen actively and respond thoughtfully to the guest&apos;s concerns.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 px-6 text-center">
                <p className="text-muted-foreground">AI insights will appear once the conversation begins...</p>
              </div>
            )}
        </SheetContent>
      </Sheet>

      {/* Loading Overlay for End Session */}
      {isEndingSession && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6 pb-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-blue-600/30 border-t-blue-600 animate-spin"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Ending Session</h3>
                <p className="text-sm text-muted-foreground">
                  Evaluating your performance and preparing results...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

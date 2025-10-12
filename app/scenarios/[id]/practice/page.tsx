'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Scenario } from '@/lib/types/scenario';
import { ConversationMessage } from '@/lib/types/session';

export default function PracticeSessionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(true);

  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Voice interaction states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);

  // Advanced AI tracking states
  const [emotionContext, setEmotionContext] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [showAiInsights, setShowAiInsights] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
        const response = await fetch(`/api/scenarios/${id}`);
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
  }, [id]);

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

          setCurrentTranscript(finalTranscript || interimTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (scenario && !sessionStarted && !scenarioLoading) {
      initializeSession();
    }
  }, [scenario, sessionStarted, scenarioLoading]);

  const initializeSession = async () => {
    if (!scenario) return;

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: scenario.id,
          trainee_id: 'demo-user-001',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSessionId(data.data.id);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
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
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setCurrentTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Stop listening and process the message
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);

      if (currentTranscript.trim()) {
        handleVoiceMessage(currentTranscript.trim());
      }
    }
  };

  // Handle voice message from trainee
  const handleVoiceMessage = async (message: string) => {
    if (!scenario || !sessionId) return;

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
  };


  const endSession = async () => {
    if (!sessionId || !scenario) return;

    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_history: conversation,
          turns_completed: turnCount,
          status: 'completed',
        }),
      });

      const evaluationResponse = await fetch('/api/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          scenario,
          transcript: conversation,
        }),
      });

      const evaluationData = await evaluationResponse.json();

      // Store evaluation results in localStorage for the results page
      if (evaluationData.success && typeof window !== 'undefined') {
        const resultsData = {
          evaluation: evaluationData.data,
          transcript: conversation,
          turns_completed: turnCount,
          sessionId: sessionId
        };
        localStorage.setItem(`evaluation_${sessionId}`, JSON.stringify(resultsData));
      }

      // Redirect to results page with sessionId
      router.push(`/scenarios/${scenario.id}/results?sessionId=${sessionId}`);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };


  if (scenarioLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading scenario...</p>
        </div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-slate-400">Scenario not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-slate-900/90">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-[#000814] to-[#003566] rounded-xl shadow-lg">
              <svg className="w-5 h-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">{scenario.title}</h1>
              <p className="text-sm text-slate-400">Live Training Session</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-800 rounded-xl border border-slate-700 shadow-sm">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-base font-bold text-slate-100">{turnCount}</span>
              <span className="text-sm text-slate-400">/ 10</span>
            </div>
            <button
              onClick={endSession}
              className="px-5 py-2.5 bg-gradient-to-r from-[#8B0000] to-[#6B0000] hover:from-[#6B0000] hover:to-[#5B0000] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#8B0000]/20 hover:shadow-xl hover:shadow-[#8B0000]/30"
            >
              End Session
            </button>
          </div>
        </div>
      </header>

      {/* Context Banner */}
      <div className="bg-blue-950/50 border-b border-blue-900 py-3">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-200">
              <strong className="font-semibold">Context:</strong> {scenario.context_background}
            </p>
          </div>
        </div>
      </div>

      {/* Voice Interaction Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-280px)]">

          {/* Avatar Display - Center/Left */}
          <div className="lg:col-span-2 bg-slate-800 rounded-3xl shadow-xl border border-slate-700 overflow-hidden flex flex-col">
            {/* Avatar Area */}
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-750 to-slate-800 relative">
              {/* Animated background effect */}
              <div className="absolute inset-0">
                <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl transition-all duration-1000 ${
                  isSpeaking ? 'bg-cyan-500/20 animate-pulse' : 'bg-cyan-500/5'
                }`}></div>
                <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl transition-all duration-1000 ${
                  isSpeaking ? 'bg-blue-500/20 animate-pulse' : 'bg-blue-500/5'
                }`}></div>
              </div>

              {/* Avatar Circle */}
              <div className="relative z-10">
                <div className={`w-64 h-64 rounded-full bg-gradient-to-br from-[#000814] to-[#003566] border-4 flex items-center justify-center transition-all duration-300 ${
                  isSpeaking
                    ? 'border-cyan-400 shadow-2xl shadow-cyan-500/50 scale-105'
                    : isLoading
                    ? 'border-blue-400 shadow-xl shadow-blue-500/30'
                    : 'border-slate-600 shadow-lg'
                }`}>
                  <svg className={`w-32 h-32 transition-all duration-300 ${
                    isSpeaking ? 'text-cyan-300' : 'text-slate-400'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>

                {/* Status Indicators */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  {isSpeaking && (
                    <div className="px-6 py-2 bg-cyan-500 text-white rounded-full font-semibold text-sm shadow-lg flex items-center gap-2 animate-pulse">
                      <div className="flex gap-1">
                        <div className="w-1 h-4 bg-white rounded-full animate-bounce"></div>
                        <div className="w-1 h-4 bg-white rounded-full animate-bounce delay-100"></div>
                        <div className="w-1 h-4 bg-white rounded-full animate-bounce delay-200"></div>
                      </div>
                      <span>Guest Speaking...</span>
                    </div>
                  )}
                  {isLoading && !isSpeaking && (
                    <div className="px-6 py-2 bg-blue-500 text-white rounded-full font-semibold text-sm shadow-lg">
                      Thinking...
                    </div>
                  )}
                  {!isSpeaking && !isLoading && !isListening && (
                    <div className="px-6 py-2 bg-slate-700 text-slate-300 rounded-full font-semibold text-sm shadow-lg border border-slate-600">
                      Ready to listen
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Voice Controls */}
            <div className="p-6 bg-slate-900 border-t border-slate-700">
              <div className="flex items-center justify-center gap-6">
                {/* Microphone Button */}
                <div className="text-center">
                  <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={isSpeaking || isLoading}
                    className={`w-20 h-20 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl ${
                      isListening
                        ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/50 animate-pulse'
                        : 'bg-gradient-to-br from-[#8B0000] to-[#6B0000] hover:from-[#6B0000] hover:to-[#5B0000] text-white shadow-[#8B0000]/50 hover:scale-110'
                    }`}
                  >
                    {isListening ? (
                      <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    ) : (
                      <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </button>
                  <p className="text-sm text-slate-300 mt-2 font-semibold">
                    {isListening ? 'Click to Stop' : 'Click to Speak'}
                  </p>
                </div>

                {/* Toggle Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-semibold transition-all border border-slate-600"
                  >
                    {showTranscript ? 'Hide' : 'Show'} Chat
                  </button>
                  <button
                    onClick={() => setShowAiInsights(!showAiInsights)}
                    className="px-4 py-2 bg-cyan-900/50 hover:bg-cyan-800 text-cyan-200 rounded-lg text-sm font-bold transition-all border-2 border-cyan-600"
                  >
                    {showAiInsights ? 'Hide' : 'Show'} AI Insights
                  </button>
                </div>
              </div>

              {/* Live Transcript Display */}
              {isListening && currentTranscript && (
                <div className="mt-4 p-4 bg-slate-800 border-2 border-emerald-500 rounded-2xl">
                  <p className="text-xs text-emerald-400 font-semibold mb-1">You're saying:</p>
                  <p className="text-slate-100 text-sm">{currentTranscript}</p>
                </div>
              )}
            </div>
          </div>

          {/* Conversation Transcript - Right Sidebar */}
          {showTranscript && (
            <div className="lg:col-span-1 bg-slate-800 rounded-3xl shadow-xl border border-slate-700 p-6 overflow-hidden flex flex-col">
              <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Conversation
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {conversation.map((message, index) => (
                  <div key={index} className={`${
                    message.speaker === 'trainee' ? 'text-right' : 'text-left'
                  }`}>
                    <div className={`inline-block max-w-[85%] rounded-xl px-4 py-2 ${
                      message.speaker === 'trainee'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-100 border border-slate-600'
                    }`}>
                      <p className={`text-xs font-semibold mb-1 ${
                        message.speaker === 'trainee' ? 'text-emerald-100' : 'text-slate-400'
                      }`}>
                        {message.speaker === 'trainee' ? 'You' : 'Guest'}
                      </p>
                      <p className="text-sm">{message.text}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 px-1">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* AI Insights Panel - NEW ADVANCED FEATURE */}
          {showAiInsights && aiInsights && (
            <div className="lg:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border-2 border-cyan-500/30 p-6 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Insights
                </h3>
                <span className="px-2 py-1 bg-cyan-900/50 text-cyan-300 text-xs font-bold rounded-lg border border-cyan-700">
                  LIVE
                </span>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                {/* Guest Emotion State */}
                <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                  <p className="text-xs font-bold text-slate-400 mb-2">GUEST EMOTIONAL STATE</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      aiInsights.current_emotion?.includes('angry') ? 'bg-red-500 animate-pulse' :
                      aiInsights.current_emotion?.includes('frustrated') ? 'bg-orange-500' :
                      aiInsights.current_emotion?.includes('calm') || aiInsights.current_emotion?.includes('satisfied') ? 'bg-green-500' :
                      aiInsights.current_emotion?.includes('happy') ? 'bg-emerald-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <p className="text-base font-bold text-slate-100 capitalize">
                      {aiInsights.current_emotion?.replace(/_/g, ' ') || 'Neutral'}
                    </p>
                  </div>
                </div>

                {/* Escalation Meter */}
                <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                  <p className="text-xs font-bold text-slate-400 mb-2">ESCALATION LEVEL</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Current</span>
                      <span className="font-bold text-slate-100">{aiInsights.escalation_level}/100</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          aiInsights.escalation_level >= 70 ? 'bg-gradient-to-r from-red-600 to-red-500' :
                          aiInsights.escalation_level >= 40 ? 'bg-gradient-to-r from-orange-600 to-orange-500' :
                          'bg-gradient-to-r from-green-600 to-green-500'
                        }`}
                        style={{ width: `${aiInsights.escalation_level}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* De-escalation Progress */}
                <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                  <p className="text-xs font-bold text-slate-400 mb-2">DE-ESCALATION PROGRESS</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Progress</span>
                      <span className="font-bold text-emerald-400">{Math.round(aiInsights.de_escalation_progress)}/100</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-500"
                        style={{ width: `${aiInsights.de_escalation_progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Trainee Performance Score */}
                <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                  <p className="text-xs font-bold text-slate-400 mb-2">YOUR PERFORMANCE</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`text-3xl font-bold ${
                        aiInsights.trainee_performance >= 70 ? 'text-green-400' :
                        aiInsights.trainee_performance >= 50 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {Math.round(aiInsights.trainee_performance)}
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">out of 100</p>
                        <p className="text-sm font-semibold text-slate-200">
                          {aiInsights.trainee_performance >= 70 ? 'Excellent' :
                           aiInsights.trainee_performance >= 50 ? 'Good' : 'Needs Work'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Tips */}
                {aiInsights.escalation_level > 50 && (
                  <div className="bg-amber-900/30 rounded-xl p-4 border-2 border-amber-600/50">
                    <p className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      SUGGESTION
                    </p>
                    <p className="text-xs text-amber-200">
                      Guest is still escalated. Try showing more empathy and offering concrete solutions.
                    </p>
                  </div>
                )}

                {aiInsights.de_escalation_progress > 60 && (
                  <div className="bg-emerald-900/30 rounded-xl p-4 border-2 border-emerald-600/50">
                    <p className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      GREAT JOB!
                    </p>
                    <p className="text-xs text-emerald-200">
                      You're doing well! The guest is calming down. Keep up the professional approach.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700 py-5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-cyan-900/50 to-blue-900/50 rounded-xl border border-cyan-700 shadow-lg">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100 mb-1.5 flex items-center gap-2">
                <span className="px-2 py-1 bg-cyan-900/50 text-cyan-300 border border-cyan-700 rounded-lg text-xs font-semibold">PRO TIP</span>
                Best Practices for This Scenario
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong className="text-slate-100">Demonstrate empathy</strong>, communicate clearly, <strong className="text-slate-100">offer practical solutions</strong>, and maintain professionalism throughout the interaction. Listen actively and respond thoughtfully to the guest's concerns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

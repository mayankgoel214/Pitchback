'use client';

import { useState } from 'react';

interface UseVADReturn {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

export function useVoiceActivityDetection(): UseVADReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);

  const startListening = async () => {
    // TODO: Implement VAD
    throw new Error('Not implemented');
  };

  const stopListening = () => {
    // TODO: Implement
    setIsListening(false);
  };

  return {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
  };
}

'use client';

import { TrainingSession } from '@/lib/types/session';

export function useSessions() {
  // TODO: Implement with react-query
  return {
    sessions: [] as TrainingSession[],
    isLoading: false,
    error: null,
  };
}

export function useSession(id: string) {
  // TODO: Implement with react-query
  return {
    session: null as TrainingSession | null,
    isLoading: false,
    error: null,
  };
}

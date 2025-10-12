'use client';

import { User } from '@/lib/types/user';

export function useAuth() {
  // TODO: Implement with Supabase Auth
  return {
    user: null as User | null,
    isLoading: false,
    error: null,
    signIn: async (email: string, password: string) => {},
    signUp: async (email: string, password: string) => {},
    signOut: async () => {},
  };
}

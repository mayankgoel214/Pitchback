'use client';

import { Scenario } from '@/lib/types/scenario';

export function useScenarios() {
  // TODO: Implement with react-query
  return {
    scenarios: [] as Scenario[],
    isLoading: false,
    error: null,
  };
}

export function useScenario(id: string) {
  // TODO: Implement with react-query
  return {
    scenario: null as Scenario | null,
    isLoading: false,
    error: null,
  };
}

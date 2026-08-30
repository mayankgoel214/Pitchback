import { Scenario } from '@/lib/types/scenario';

export async function getScenarios(): Promise<Scenario[]> {
  // TODO: Implement
  return [];
}

export async function getScenarioById(id: string): Promise<Scenario | null> {
  // TODO: Implement
  return null;
}

export async function createScenario(data: Partial<Scenario>): Promise<Scenario> {
  // TODO: Implement
  throw new Error('Not implemented');
}

export async function updateScenario(id: string, data: Partial<Scenario>): Promise<Scenario> {
  // TODO: Implement
  throw new Error('Not implemented');
}

export async function deleteScenario(id: string): Promise<void> {
  // TODO: Implement
  throw new Error('Not implemented');
}

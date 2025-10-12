import { TrainingSession } from '@/lib/types/session';

export async function getSessions(): Promise<TrainingSession[]> {
  // TODO: Implement
  return [];
}

export async function getSessionById(id: string): Promise<TrainingSession | null> {
  // TODO: Implement
  return null;
}

export async function createSession(scenarioId: string): Promise<TrainingSession> {
  // TODO: Implement
  throw new Error('Not implemented');
}

export async function updateSession(id: string, data: Partial<TrainingSession>): Promise<TrainingSession> {
  // TODO: Implement
  throw new Error('Not implemented');
}

export async function completeSession(id: string): Promise<TrainingSession> {
  // TODO: Implement
  throw new Error('Not implemented');
}

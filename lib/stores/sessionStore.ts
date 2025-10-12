import { TrainingSession } from '@/lib/types/session';

// In-memory storage for sessions (shared across API routes)
// NOTE: In Next.js dev mode, different route files may get different instances
// of this module due to hot-reloading. In production or with a real database,
// this wouldn't be an issue. For now, use GET /api/sessions to see all sessions.
// In production, replace with PostgreSQL/Prisma.
export const sessions = new Map<string, TrainingSession>();

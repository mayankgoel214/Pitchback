// Application constants
export const APP_NAME = 'HospitalityAI Training Simulator';
export const APP_DESCRIPTION = 'AI-powered training platform for hotel front desk staff';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  TRAINEE_DASHBOARD: '/dashboard',
  SCENARIOS: '/scenarios',
  SESSIONS: '/sessions',
  PROFILE: '/profile',
  MANAGER_DASHBOARD: '/dashboard',
  MANAGER_SCENARIOS: '/scenarios',
  TEAM: '/team',
  ANALYTICS: '/analytics',
};

export const SCENARIO_CATEGORIES = [
  'angry_guests',
  'emergencies',
  'language_barriers',
  'special_requests',
  'billing_disputes',
] as const;

export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export const USER_ROLES = ['trainee', 'manager', 'admin', 'super_admin'] as const;

export const EVALUATION_CRITERIA = [
  'empathy',
  'clarity',
  'problem_solving',
  'professionalism',
] as const;

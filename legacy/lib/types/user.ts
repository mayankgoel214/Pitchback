// User type definitions
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization_id: string;
  avatar_url?: string;
  auth_provider_id: string;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'trainee' | 'manager' | 'admin' | 'super_admin';

export interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  max_trainees: number;
  max_custom_scenarios: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

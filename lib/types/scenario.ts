// Scenario type definitions
export interface Scenario {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  scenario_type: string;
  ai_guest_persona: string; // JSON string of GuestPersona
  ai_guest_opening: string;
  context_background: string;
  success_criteria: any; // JSON object
  evaluation_rubric: any; // JSON object
}

export interface GuestPersona {
  personality_traits: string[];
  speaking_style: string;
  tone: string;
  emotion_progression: {
    start: string;
    good_response: string;
    bad_response: string;
    end_goal: string;
  };
  custom_instructions?: string;
  voice_settings?: {
    voice_id: string;
    stability: number;
    similarity_boost: number;
  };
}

export interface SuccessCriteria {
  empathy: CriteriaDetail;
  clarity: CriteriaDetail;
  problem_solving: CriteriaDetail;
  professionalism: CriteriaDetail;
}

export interface CriteriaDetail {
  description: string;
  keywords?: string[];
  requirements?: string[];
  required_solutions?: number;
  avoid_phrases?: string[];
  required_behaviors?: string[];
  min_score: number;
  examples: {
    good: string[];
    bad: string[];
  };
}

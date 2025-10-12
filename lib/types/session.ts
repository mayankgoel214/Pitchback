// Session type definitions
export interface TrainingSession {
  id: string;
  trainee_id: string;
  scenario_id: string;
  video_url?: string;
  audio_url?: string;
  transcript: Transcript;
  conversation_history: ConversationMessage[];
  evaluation?: Evaluation;
  scores: Scores;
  overall_score?: number;
  duration_seconds?: number;
  turns_completed: number;
  hints_used: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  completed_at?: string;
  created_at: string;
}

export interface ConversationMessage {
  turn: number;
  speaker: 'trainee' | 'ai_guest';
  text: string;
  timestamp: string;
  audio_url?: string;
  duration_ms?: number;
}

export interface Transcript {
  exchanges: ConversationMessage[];
}

export interface Scores {
  empathy: number;
  clarity: number;
  problem_solving: number;
  professionalism: number;
}

export interface Evaluation {
  problem_resolved: boolean;
  resolution_summary: string;
  scores: Scores & { overall: number };
  detailed_feedback: {
    empathy: FeedbackDetail;
    clarity: FeedbackDetail;
    problem_solving: FeedbackDetail;
    professionalism: FeedbackDetail;
  };
  overall_summary: string;
  best_practices: string[];
  key_mistakes: string[];
  improvement_recommendations: string[];
  standout_moments?: string[];
}

export interface FeedbackDetail {
  score: number;
  what_went_well: string[];
  areas_for_improvement: string[];
  specific_examples: string[];
}

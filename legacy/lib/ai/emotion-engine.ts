/**
 * Advanced Emotion Tracking Engine
 * Tracks guest emotional state throughout conversation and adapts AI behavior
 */

import { ConversationMessage } from '@/lib/types/session';
import { Scenario } from '@/lib/types/scenario';

export type EmotionState =
  | 'very_angry'
  | 'angry'
  | 'frustrated'
  | 'neutral'
  | 'calming'
  | 'satisfied'
  | 'happy';

export type SentimentScore = {
  empathy: number;        // 0-100
  professionalism: number; // 0-100
  solution_focus: number;  // 0-100
  tone: 'positive' | 'neutral' | 'negative';
};

export interface EmotionContext {
  current_state: EmotionState;
  state_history: Array<{
    state: EmotionState;
    turn: number;
    trigger: string;
  }>;
  sentiment_trend: Array<SentimentScore>;
  escalation_level: number; // 0-100, higher = more escalated
  de_escalation_progress: number; // 0-100, higher = better progress
  trainee_performance_score: number; // 0-100 running average
}

/**
 * Analyze trainee message and return sentiment score
 */
export function analyzeSentiment(message: string): SentimentScore {
  const lowerMessage = message.toLowerCase();

  // Empathy indicators
  const empathyKeywords = {
    high: ['apologize', 'sorry', 'understand how', 'must be', 'completely understand', 'i appreciate', 'thank you for'],
    medium: ['understand', 'hear you', 'see', 'know', 'aware'],
    negative: ['but', 'however', 'policy', 'rules', 'nothing i can do', "can't help"],
  };

  // Professionalism indicators
  const professionalismKeywords = {
    high: ['certainly', 'absolutely', 'right away', 'immediately', 'let me help', 'i will'],
    medium: ['okay', 'sure', 'yes', 'help'],
    negative: ['calm down', 'relax', 'yelling', 'complaining', 'not my fault', 'not my problem'],
  };

  // Solution-focus indicators
  const solutionKeywords = {
    high: ['offer', 'solution', 'fix', 'resolve', 'upgrade', 'complimentary', 'compensation', 'alternative'],
    medium: ['help', 'try', 'can', 'will', 'arrange', 'check'],
    negative: ['wait', "can't", "won't", 'impossible', 'no way', 'not possible'],
  };

  // Calculate scores
  const empathyScore = calculateKeywordScore(lowerMessage, empathyKeywords);
  const professionalismScore = calculateKeywordScore(lowerMessage, professionalismKeywords);
  const solutionScore = calculateKeywordScore(lowerMessage, solutionKeywords);

  // Determine overall tone
  const avgScore = (empathyScore + professionalismScore + solutionScore) / 3;
  const tone: 'positive' | 'neutral' | 'negative' =
    avgScore >= 60 ? 'positive' : avgScore >= 40 ? 'neutral' : 'negative';

  return {
    empathy: empathyScore,
    professionalism: professionalismScore,
    solution_focus: solutionScore,
    tone,
  };
}

/**
 * Calculate score based on keyword presence
 */
function calculateKeywordScore(
  message: string,
  keywords: { high: string[]; medium: string[]; negative: string[] }
): number {
  let score = 50; // Start neutral

  // Check high-value keywords (+15 each, max 3)
  const highMatches = keywords.high.filter(kw => message.includes(kw)).length;
  score += Math.min(highMatches * 15, 45);

  // Check medium-value keywords (+5 each, max 2)
  const mediumMatches = keywords.medium.filter(kw => message.includes(kw)).length;
  score += Math.min(mediumMatches * 5, 10);

  // Check negative keywords (-20 each)
  const negativeMatches = keywords.negative.filter(kw => message.includes(kw)).length;
  score -= negativeMatches * 20;

  // Clamp between 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Update emotion state based on conversation
 */
export function updateEmotionState(
  context: EmotionContext,
  traineeMessage: string,
  turnNumber: number,
  scenario: Scenario
): EmotionContext {
  // Analyze current sentiment
  const sentiment = analyzeSentiment(traineeMessage);

  // Update sentiment trend
  const sentimentTrend = [...context.sentiment_trend, sentiment];

  // Calculate trainee performance score (moving average)
  const recentSentiments = sentimentTrend.slice(-3); // Last 3 turns
  const avgEmpathy = recentSentiments.reduce((sum, s) => sum + s.empathy, 0) / recentSentiments.length;
  const avgProf = recentSentiments.reduce((sum, s) => sum + s.professionalism, 0) / recentSentiments.length;
  const avgSolution = recentSentiments.reduce((sum, s) => sum + s.solution_focus, 0) / recentSentiments.length;
  const traineePerformanceScore = (avgEmpathy + avgProf + avgSolution) / 3;

  // Determine emotion transition
  const previousState = context.current_state;
  let newState = determineNextEmotionState(
    context.current_state,
    sentiment,
    traineePerformanceScore,
    scenario
  );

  // Update escalation level
  const escalationLevel = calculateEscalationLevel(context, sentiment);
  const deEscalationProgress = calculateDeEscalationProgress(context, sentiment);

  // Record state change
  const stateHistory = [...context.state_history];
  if (newState !== previousState) {
    stateHistory.push({
      state: newState,
      turn: turnNumber,
      trigger: getTransitionTrigger(previousState, newState, sentiment),
    });
  }

  return {
    current_state: newState,
    state_history: stateHistory,
    sentiment_trend: sentimentTrend,
    escalation_level: escalationLevel,
    de_escalation_progress: deEscalationProgress,
    trainee_performance_score: traineePerformanceScore,
  };
}

/**
 * Determine next emotion state based on current state and sentiment
 */
function determineNextEmotionState(
  currentState: EmotionState,
  sentiment: SentimentScore,
  performanceScore: number,
  scenario: Scenario
): EmotionState {
  // Define state transitions
  const stateProgression: EmotionState[] = [
    'very_angry',
    'angry',
    'frustrated',
    'neutral',
    'calming',
    'satisfied',
    'happy',
  ];

  const currentIndex = stateProgression.indexOf(currentState);

  // Excellent response (80+) - move up 2 states
  if (performanceScore >= 80 && sentiment.tone === 'positive') {
    const targetIndex = Math.min(currentIndex + 2, stateProgression.length - 1);
    return stateProgression[targetIndex];
  }

  // Good response (60-79) - move up 1 state
  if (performanceScore >= 60 && sentiment.tone !== 'negative') {
    const targetIndex = Math.min(currentIndex + 1, stateProgression.length - 1);
    return stateProgression[targetIndex];
  }

  // Poor response (<40) or negative tone - move down 1 state
  if (performanceScore < 40 || sentiment.tone === 'negative') {
    const targetIndex = Math.max(currentIndex - 1, 0);
    return stateProgression[targetIndex];
  }

  // Neutral response - stay in current state
  return currentState;
}

/**
 * Calculate current escalation level (0-100)
 */
function calculateEscalationLevel(
  context: EmotionContext,
  sentiment: SentimentScore
): number {
  const stateEscalation = {
    very_angry: 100,
    angry: 80,
    frustrated: 60,
    neutral: 50,
    calming: 35,
    satisfied: 20,
    happy: 0,
  };

  const baseLevel = stateEscalation[context.current_state];

  // Adjust based on sentiment trend
  const recentTrend = context.sentiment_trend.slice(-2);
  const trendAdjustment = recentTrend.every(s => s.tone === 'negative') ? 10 :
                          recentTrend.every(s => s.tone === 'positive') ? -10 : 0;

  return Math.max(0, Math.min(100, baseLevel + trendAdjustment));
}

/**
 * Calculate de-escalation progress (0-100)
 */
function calculateDeEscalationProgress(
  context: EmotionContext,
  sentiment: SentimentScore
): number {
  if (context.state_history.length === 0) return 0;

  const startState = context.state_history[0].state;
  const currentState = context.current_state;

  const stateProgression: EmotionState[] = [
    'very_angry',
    'angry',
    'frustrated',
    'neutral',
    'calming',
    'satisfied',
    'happy',
  ];

  const startIndex = stateProgression.indexOf(startState);
  const currentIndex = stateProgression.indexOf(currentState);
  const maxProgress = stateProgression.length - 1 - startIndex;

  if (maxProgress === 0) return 100;

  const actualProgress = currentIndex - startIndex;
  return Math.max(0, Math.min(100, (actualProgress / maxProgress) * 100));
}

/**
 * Get human-readable transition trigger
 */
function getTransitionTrigger(
  previousState: EmotionState,
  newState: EmotionState,
  sentiment: SentimentScore
): string {
  const stateProgression: EmotionState[] = [
    'very_angry',
    'angry',
    'frustrated',
    'neutral',
    'calming',
    'satisfied',
    'happy',
  ];

  const prevIndex = stateProgression.indexOf(previousState);
  const newIndex = stateProgression.indexOf(newState);

  if (newIndex > prevIndex) {
    return sentiment.empathy > 70
      ? 'Strong empathy shown'
      : sentiment.solution_focus > 70
      ? 'Effective solution offered'
      : 'Positive response';
  } else if (newIndex < prevIndex) {
    return sentiment.professionalism < 40
      ? 'Unprofessional response'
      : sentiment.empathy < 40
      ? 'Lack of empathy'
      : 'Ineffective response';
  }

  return 'Neutral response';
}

/**
 * Initialize emotion context for new session
 */
export function initializeEmotionContext(scenario: Scenario): EmotionContext {
  // Parse guest persona from JSON string if needed
  let guestPersona: any;
  try {
    guestPersona = typeof scenario.ai_guest_persona === 'string'
      ? JSON.parse(scenario.ai_guest_persona)
      : scenario.ai_guest_persona;
  } catch (e) {
    guestPersona = { tone: 'neutral' };
  }

  // Determine starting state from scenario
  const tone = (guestPersona.tone || 'neutral').toLowerCase();
  const startState: EmotionState =
    tone.includes('very angry') || tone.includes('furious') ? 'very_angry' :
    tone.includes('angry') ? 'angry' :
    tone.includes('frustrated') || tone.includes('upset') ? 'frustrated' :
    'neutral';

  return {
    current_state: startState,
    state_history: [{
      state: startState,
      turn: 0,
      trigger: 'Initial state',
    }],
    sentiment_trend: [],
    escalation_level: startState === 'very_angry' ? 100 :
                      startState === 'angry' ? 80 :
                      startState === 'frustrated' ? 60 : 50,
    de_escalation_progress: 0,
    trainee_performance_score: 50,
  };
}

/**
 * Get emotion-appropriate response modifier
 */
export function getEmotionResponseModifier(state: EmotionState): string {
  const modifiers = {
    very_angry: 'You are EXTREMELY angry and upset. Speak in short, sharp sentences. Show clear frustration and impatience.',
    angry: 'You are angry and visibly upset. Your tone is firm and demanding, but you can still be reasoned with.',
    frustrated: 'You are frustrated and disappointed. You express your concerns clearly but are open to solutions.',
    neutral: 'You are calm but concerned. You want your issue addressed professionally.',
    calming: 'You are starting to feel heard and understood. Your tone is softening.',
    satisfied: 'You are satisfied with how this is being handled. You are appreciative of the help.',
    happy: 'You are pleased with the resolution. You express gratitude and satisfaction.',
  };

  return modifiers[state];
}

import OpenAI from 'openai';
import { Scenario } from '@/lib/types/scenario';
import { ConversationMessage, Evaluation } from '@/lib/types/session';
import {
  EmotionContext,
  analyzeSentiment,
  updateEmotionState,
  getEmotionResponseModifier,
  initializeEmotionContext,
} from './emotion-engine';

// Debug: Check if API key is loaded
const apiKey = process.env.OPENAI_API_KEY;
const orgId = process.env.OPENAI_ORG_ID;
const projectId = process.env.OPENAI_PROJECT_ID;

console.log('🔑 [lib/ai/openai.ts] API Key Status:', {
  exists: !!apiKey,
  length: apiKey?.length || 0,
  starts_with: apiKey?.substring(0, 8) || 'undefined',
  ends_with: apiKey?.substring(apiKey.length - 4) || 'undefined',
  has_whitespace: apiKey?.includes('\n') || apiKey?.includes('\r') || apiKey?.includes(' ') || false,
  is_project_key: apiKey?.startsWith('sk-proj-'),
  has_org_id: !!orgId,
  has_project_id: !!projectId,
});

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY is not set in environment variables!');
}

// Configure OpenAI client with optional project/org settings
const openaiConfig: any = {
  apiKey: apiKey,
};

if (orgId) {
  openaiConfig.organization = orgId;
}

if (projectId) {
  openaiConfig.project = projectId;
}

// Initialize OpenAI client
const openai = new OpenAI(openaiConfig);

/**
 * Generate AI guest response based on scenario and conversation history
 * Now with advanced emotion tracking and dynamic difficulty adjustment
 */
export async function generateAIGuestResponse(
  scenario: Scenario,
  conversationHistory: ConversationMessage[],
  traineeMessage: string,
  emotionContext?: EmotionContext
): Promise<{ response: string; emotionContext: EmotionContext; sentiment: any }> {
  try {
    // Initialize or use provided emotion context
    let currentEmotionContext = emotionContext || initializeEmotionContext(scenario);

    // Analyze trainee's message sentiment (keep for emotion state transitions)
    const sentiment = analyzeSentiment(traineeMessage);

    // Update emotion state based on trainee's performance
    const turnNumber = conversationHistory.length;
    currentEmotionContext = updateEmotionState(
      currentEmotionContext,
      traineeMessage,
      turnNumber,
      scenario
    );

    // Use GPT to evaluate live performance (similar to final evaluation)
    const gptPerformanceScore = await evaluateLivePerformance(
      scenario,
      conversationHistory,
      traineeMessage,
      currentEmotionContext.escalation_level
    );

    // Override the keyword-based performance score with GPT evaluation
    currentEmotionContext.trainee_performance_score = gptPerformanceScore;

    // Build enhanced system prompt with emotion awareness
    const systemPrompt = buildEnhancedAIGuestSystemPrompt(
      scenario,
      conversationHistory,
      currentEmotionContext
    );

    // Build conversation messages for GPT-4
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg) => ({
        role: (msg.speaker === 'trainee' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.text,
      })),
      { role: 'user', content: traineeMessage },
    ];

    // Adjust temperature based on emotion state
    const temperature = getTemperatureForEmotion(currentEmotionContext.current_state);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature,
      max_tokens: 200,
    });

    const response = completion.choices[0].message.content || 'I appreciate your help.';

    return {
      response,
      emotionContext: currentEmotionContext,
      sentiment,
    };
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI guest response');
  }
}

/**
 * Build enhanced system prompt with emotion awareness
 */
function buildEnhancedAIGuestSystemPrompt(
  scenario: Scenario,
  conversationHistory: ConversationMessage[],
  emotionContext: EmotionContext
): string {
  // Parse guest persona from JSON string if needed
  let persona: any;
  try {
    persona = typeof scenario.ai_guest_persona === 'string'
      ? JSON.parse(scenario.ai_guest_persona)
      : scenario.ai_guest_persona;
  } catch (e) {
    persona = {
      personality_traits: ['professional'],
      speaking_style: 'polite',
      tone: 'neutral',
      emotion_progression: {
        start: 'neutral',
        good_response: 'satisfied',
        bad_response: 'frustrated',
        end_goal: 'satisfied'
      },
      custom_instructions: ''
    };
  }

  const emotionModifier = getEmotionResponseModifier(emotionContext.current_state);

  // Get performance insights
  const performanceLevel =
    emotionContext.trainee_performance_score >= 70 ? 'excellent' :
    emotionContext.trainee_performance_score >= 50 ? 'adequate' : 'poor';

  return `You are roleplaying as a hotel guest in a training simulation. Here is your character:

SCENARIO CONTEXT:
${scenario.context_background}

YOUR CHARACTER:
- Personality: ${persona.personality_traits?.join(', ') || 'professional'}
- Speaking style: ${persona.speaking_style || 'polite'}
- Base tone: ${persona.tone || 'neutral'}

CURRENT EMOTIONAL STATE: ${emotionContext.current_state.toUpperCase().replace('_', ' ')}
${emotionModifier}

EMOTION PROGRESSION:
- Initial state: ${persona.emotion_progression?.start || 'neutral'}
- If well-handled: ${persona.emotion_progression?.good_response || 'satisfied'}
- If poorly-handled: ${persona.emotion_progression?.bad_response || 'frustrated'}
- End goal: ${persona.emotion_progression?.end_goal || 'satisfied'}

TRAINEE PERFORMANCE SO FAR: ${performanceLevel}
- Escalation level: ${emotionContext.escalation_level}/100
- De-escalation progress: ${emotionContext.de_escalation_progress}/100
${emotionContext.state_history.length > 1 ? `- Recent emotion change: ${emotionContext.state_history[emotionContext.state_history.length - 1].trigger}` : ''}

${persona.custom_instructions || ''}

IMPORTANT RULES:
- Stay in character throughout the conversation
- Respond naturally like a real guest in your current emotional state
- Keep responses under 3-4 sentences
- Don't break character or mention this is a simulation
- React authentically to the trainee's approach
- If trainee shows empathy and offers solutions, gradually calm down
- If trainee is defensive or unhelpful, escalate frustration realistically
- Match your tone to your current emotional state: ${emotionContext.current_state}`;
}

/**
 * Adjust GPT temperature based on emotion state for more realistic responses
 */
function getTemperatureForEmotion(emotionState: string): number {
  const temperatureMap: Record<string, number> = {
    very_angry: 0.95, // High variability for unpredictable angry responses
    angry: 0.85,
    frustrated: 0.75,
    neutral: 0.7,
    calming: 0.65,
    satisfied: 0.6,
    happy: 0.55, // Lower variability for more consistent positive responses
  };

  return temperatureMap[emotionState] || 0.8;
}

/**
 * Analyze trainee's performance to adjust AI emotion
 */
function analyzeTraineePerformance(conversationHistory: ConversationMessage[]): 'good' | 'neutral' | 'poor' {
  const traineeMessages = conversationHistory
    .filter((msg) => msg.speaker === 'trainee')
    .map((msg) => msg.text.toLowerCase());

  if (traineeMessages.length === 0) return 'neutral';

  const lastMessage = traineeMessages[traineeMessages.length - 1];

  // Positive indicators
  const positiveKeywords = [
    'apologize', 'sorry', 'understand', 'help', 'solution', 'offer',
    'immediately', 'right away', 'complimentary', 'upgrade', 'appreciate',
  ];

  // Negative indicators
  const negativeKeywords = [
    'not my fault', 'nothing i can do', 'policy', 'rules', 'wait',
    'calm down', 'yelling', 'complaining', "can't help",
  ];

  const positiveCount = positiveKeywords.filter((kw) => lastMessage.includes(kw)).length;
  const negativeCount = negativeKeywords.filter((kw) => lastMessage.includes(kw)).length;

  if (positiveCount >= 2 || (positiveCount > 0 && negativeCount === 0)) {
    return 'good';
  } else if (negativeCount >= 2 || (negativeCount > 0 && positiveCount === 0)) {
    return 'poor';
  }

  return 'neutral';
}

/**
 * Evaluate training session and provide detailed feedback
 */
export async function evaluateSession(
  scenario: Scenario,
  transcript: ConversationMessage[]
): Promise<Evaluation> {
  try {
    const systemPrompt = buildEvaluationSystemPrompt(scenario);
    const conversationText = transcript
      .map((msg) => `${msg.speaker === 'trainee' ? 'TRAINEE' : 'GUEST'}: ${msg.text}`)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',  // gpt-4o supports JSON mode
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Evaluate this training session:\n\n${conversationText}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return result as Evaluation;
  } catch (error) {
    console.error('Error evaluating session:', error);
    throw new Error('Failed to evaluate session');
  }
}

/**
 * Build system prompt for evaluation
 */
function buildEvaluationSystemPrompt(scenario: Scenario): string {
  const criteria = typeof scenario.success_criteria === 'string'
    ? JSON.parse(scenario.success_criteria)
    : scenario.success_criteria;

  return `You are an expert hospitality trainer evaluating a front desk training session.

SCENARIO: ${scenario.title}
CONTEXT: ${scenario.context_background}

CRITICAL: PROBLEM RESOLUTION REQUIREMENT
Before scoring, you MUST verify:
1. What was the guest's core problem/need in this scenario?
2. Did the trainee actually address and resolve this problem?
3. Was a concrete solution offered AND accepted/acknowledged by the guest?

If the conversation ended WITHOUT resolving the guest's problem:
- Problem-solving score MUST be 0-30 (severe penalty)
- Overall score CANNOT exceed 50
- Mark clearly in improvement recommendations: "Failed to resolve guest's core issue"

EVALUATION CRITERIA:

1. EMPATHY (0-100):
${criteria.empathy.description}
Keywords to look for: ${criteria.empathy.keywords?.join(', ') || 'empathetic language'}
Minimum score to pass: ${criteria.empathy.min_score}
Good examples: ${criteria.empathy.examples.good.join(' | ')}
Bad examples: ${criteria.empathy.examples.bad.join(' | ')}

2. CLARITY (0-100):
${criteria.clarity.description}
Requirements: ${criteria.clarity.requirements?.join(', ') || 'clear communication'}
Minimum score to pass: ${criteria.clarity.min_score}
Good examples: ${criteria.clarity.examples.good.join(' | ')}
Bad examples: ${criteria.clarity.examples.bad.join(' | ')}

3. PROBLEM-SOLVING (0-100):
${criteria.problem_solving.description}
Required number of solutions: ${criteria.problem_solving.required_solutions || 2}
Minimum score to pass: ${criteria.problem_solving.min_score}
Good examples: ${criteria.problem_solving.examples.good.join(' | ')}
Bad examples: ${criteria.problem_solving.examples.bad.join(' | ')}

4. PROFESSIONALISM (0-100):
${criteria.professionalism.description}
Avoid phrases: ${criteria.professionalism.avoid_phrases?.join(', ') || 'defensive language'}
Required behaviors: ${criteria.professionalism.required_behaviors?.join(', ') || 'stay professional'}
Minimum score to pass: ${criteria.professionalism.min_score}
Good examples: ${criteria.professionalism.examples.good.join(' | ')}
Bad examples: ${criteria.professionalism.examples.bad.join(' | ')}

Provide your evaluation as a JSON object with this EXACT structure:
{
  "problem_resolved": boolean (true ONLY if guest's core issue was actually addressed and resolved),
  "resolution_summary": "Brief explanation: what was the problem and was it solved?",
  "scores": {
    "empathy": number (0-100),
    "clarity": number (0-100),
    "problem_solving": number (0-100 - MUST be 0-30 if problem_resolved is false),
    "professionalism": number (0-100),
    "overall": number (average of the four scores, MAX 50 if problem_resolved is false)
  },
  "detailed_feedback": {
    "empathy": {
      "score": number (same as above),
      "what_went_well": ["point 1", "point 2", "point 3"],
      "areas_for_improvement": ["point 1", "point 2"],
      "specific_examples": ["quote from conversation showing empathy or lack thereof"]
    },
    "clarity": {
      "score": number,
      "what_went_well": ["point 1", "point 2"],
      "areas_for_improvement": ["point 1", "point 2"],
      "specific_examples": ["quote from conversation"]
    },
    "problem_solving": {
      "score": number,
      "what_went_well": ["point 1", "point 2"],
      "areas_for_improvement": ["point 1", "point 2"],
      "specific_examples": ["quote showing solutions offered"]
    },
    "professionalism": {
      "score": number,
      "what_went_well": ["point 1", "point 2"],
      "areas_for_improvement": ["point 1", "point 2"],
      "specific_examples": ["quote from conversation"]
    }
  },
  "overall_summary": "2-3 sentence summary of performance",
  "best_practices": ["practice 1", "practice 2", "practice 3"],
  "key_mistakes": ["mistake 1", "mistake 2"],
  "improvement_recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

Be specific and constructive. Quote actual phrases from the conversation in specific_examples.`;
}

/**
 * Evaluate trainee's current response in real-time for live feedback
 * Uses similar criteria as final evaluation but lighter weight
 */
export async function evaluateLivePerformance(
  scenario: Scenario,
  conversationHistory: ConversationMessage[],
  traineeMessage: string,
  currentEscalationLevel: number
): Promise<number> {
  try {
    const conversationSoFar = conversationHistory
      .map((msg) => `${msg.speaker === 'trainee' ? 'TRAINEE' : 'GUEST'}: ${msg.text}`)
      .join('\n');

    const systemPrompt = `You are evaluating a trainee's response in a live hospitality training session.

SCENARIO: ${scenario.title}
CONTEXT: ${scenario.context_background}
CURRENT ESCALATION LEVEL: ${currentEscalationLevel}/100

CONVERSATION SO FAR:
${conversationSoFar}

TRAINEE'S LATEST MESSAGE:
${traineeMessage}

CRITICAL EVALUATION RULES:
1. Has the trainee shown EMPATHY? (understanding, apology, acknowledgment)
2. Is the trainee being CLEAR and professional in communication?
3. Is the trainee actively working toward PROBLEM-SOLVING? (offering solutions, taking action)
4. Is the trainee maintaining PROFESSIONALISM? (no defensive language, staying calm)

PROBLEM RESOLUTION CHECK:
- If the guest's core problem is NOT YET ADDRESSED or NO SOLUTION offered: score MUST be 0-40
- If trainee is making progress toward resolution: score can be 40-70
- If trainee has offered concrete solutions and guest is responding positively: score can be 70-95

Respond with a JSON object:
{
  "performance_score": number (0-100, based on above rules),
  "problem_being_addressed": boolean,
  "brief_reasoning": "One sentence explaining the score"
}

Be strict - keyword phrases alone without actual problem-solving should score low.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use mini for faster, cheaper live evaluation
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Evaluate this trainee response.' },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 150,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"performance_score": 50}');
    return result.performance_score || 50;
  } catch (error) {
    console.error('Error evaluating live performance:', error);
    // Fallback to keyword-based if GPT fails
    return 50;
  }
}

/**
 * Transcribe audio using Whisper (not yet implemented)
 */
export async function transcribeAudio(audioFile: File): Promise<string> {
  // TODO: Implement Whisper API
  throw new Error('Not implemented');
}

/**
 * Generate speech using TTS (not yet implemented)
 */
export async function generateSpeech(text: string): Promise<Buffer> {
  // TODO: Implement TTS
  throw new Error('Not implemented');
}

import { NextRequest, NextResponse } from 'next/server';
import { generateAIGuestResponse } from '@/lib/ai/openai';
import { Scenario } from '@/lib/types/scenario';
import { ConversationMessage } from '@/lib/types/session';
import { EmotionContext } from '@/lib/ai/emotion-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenario, conversation_history, trainee_message, emotion_context } = body;

    // Validate required fields
    if (!scenario) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'scenario is required',
        },
        { status: 400 }
      );
    }

    if (!trainee_message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'trainee_message is required',
        },
        { status: 400 }
      );
    }

    // Default to empty array if conversation_history not provided
    const conversationHistory: ConversationMessage[] = conversation_history || [];
    const emotionContext: EmotionContext | undefined = emotion_context;

    // Generate AI guest response using GPT-4 with emotion tracking
    const result = await generateAIGuestResponse(
      scenario as Scenario,
      conversationHistory,
      trainee_message,
      emotionContext
    );

    return NextResponse.json({
      success: true,
      data: {
        ai_response: result.response,
        emotion_context: result.emotionContext,
        sentiment_analysis: result.sentiment,
        ai_insights: {
          current_emotion: result.emotionContext.current_state,
          escalation_level: result.emotionContext.escalation_level,
          trainee_performance: result.emotionContext.trainee_performance_score,
          de_escalation_progress: result.emotionContext.de_escalation_progress,
        },
      },
    });
  } catch (error) {
    console.error('Error in conversation endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'AI conversation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

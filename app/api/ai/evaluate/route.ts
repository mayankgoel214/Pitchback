import { NextRequest, NextResponse } from 'next/server';
import { evaluateSession } from '@/lib/ai/openai';
import { Scenario } from '@/lib/types/scenario';
import { ConversationMessage } from '@/lib/types/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenario, transcript } = body;

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

    if (!transcript || !Array.isArray(transcript)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'transcript must be an array of conversation messages',
        },
        { status: 400 }
      );
    }

    if (transcript.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'transcript cannot be empty',
        },
        { status: 400 }
      );
    }

    // Evaluate session using GPT-4
    const evaluation = await evaluateSession(
      scenario as Scenario,
      transcript as ConversationMessage[]
    );

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error('Error in evaluation endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Evaluation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

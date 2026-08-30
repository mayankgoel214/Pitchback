import { NextRequest, NextResponse } from 'next/server';
import { evaluateSession } from '@/lib/ai/openai';
import { prisma } from '@/lib/db/prisma';
import { Scenario } from '@/lib/types/scenario';
import { ConversationMessage } from '@/lib/types/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, scenario, transcript } = body;

    // Validate required fields
    if (!session_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'session_id is required',
        },
        { status: 400 }
      );
    }

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

    // Calculate overall score from competency scores
    const overallScore = evaluation.scores.overall;

    // Save evaluation to database
    const savedEvaluation = await prisma.evaluation.create({
      data: {
        sessionId: session_id,
        overallScore: overallScore,
        competencyScores: evaluation.scores,
        strengths: evaluation.best_practices || [],
        areasForImprovement: evaluation.improvement_recommendations || [],
        detailedFeedback: evaluation.overall_summary || '',
        passed: overallScore >= 70, // 70% is passing
      },
    });

    return NextResponse.json({
      success: true,
      data: evaluation,
      evaluation_id: savedEvaluation.id,
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

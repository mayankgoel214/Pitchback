import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const traineeId = searchParams.get('trainee_id');

    // Build where clause
    const where = traineeId ? { traineeId } : {};

    // Fetch sessions from database with related data
    const sessions = await prisma.trainingSession.findMany({
      where,
      include: {
        scenario: true,
        trainee: true,
        conversationMessages: {
          orderBy: {
            turn: 'asc',
          },
        },
        evaluation: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    // Transform to match frontend TrainingSession type
    const transformedSessions = sessions.map((session) => ({
      id: session.id,
      trainee_id: session.traineeId,
      scenario_id: session.scenarioId,
      transcript: {
        exchanges: session.conversationMessages.map((msg) => ({
          speaker: msg.speaker,
          text: msg.text,
          audio_url: msg.audioUrl,
          timestamp: msg.timestamp.toISOString(),
        })),
      },
      conversation_history: session.conversationMessages.map((msg) => ({
        role: msg.speaker === 'trainee' ? 'user' : 'assistant',
        content: msg.text,
      })),
      scores: session.evaluation
        ? (session.evaluation.competencyScores as Record<string, number>)
        : {
            empathy: 0,
            clarity: 0,
            problem_solving: 0,
            professionalism: 0,
          },
      overall_score: session.evaluation?.overallScore || undefined,
      duration_seconds: session.durationMs ? Math.round(session.durationMs / 1000) : undefined,
      turns_completed: session.conversationMessages.length,
      hints_used: 0,
      status: session.status,
      started_at: session.startedAt.toISOString(),
      completed_at: session.completedAt?.toISOString(),
      created_at: session.createdAt.toISOString(),
      evaluation: session.evaluation ? {
        scores: {
          ...(session.evaluation.competencyScores as Record<string, number>),
          overall: session.evaluation.overallScore
        },
        detailed_feedback: {},
        overall_summary: session.evaluation.detailedFeedback || '',
        best_practices: session.evaluation.strengths as string[],
        key_mistakes: [],
        improvement_recommendations: session.evaluation.areasForImprovement as string[],
      } : undefined,
    }));

    return NextResponse.json({
      success: true,
      data: transformedSessions,
      count: transformedSessions.length,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sessions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenario_id, trainee_id } = body;

    // Validate required fields
    if (!scenario_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'scenario_id is required',
        },
        { status: 400 }
      );
    }

    if (!trainee_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'trainee_id is required',
        },
        { status: 400 }
      );
    }

    // Verify trainee exists
    const trainee = await prisma.user.findUnique({
      where: { id: trainee_id },
    });

    if (!trainee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trainee not found',
          message: `No trainee found with ID: ${trainee_id}`,
        },
        { status: 404 }
      );
    }

    // Verify scenario exists
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenario_id },
    });

    if (!scenario) {
      return NextResponse.json(
        {
          success: false,
          error: 'Scenario not found',
          message: `No scenario found with ID: ${scenario_id}`,
        },
        { status: 404 }
      );
    }

    // Create new session in database
    const newSession = await prisma.trainingSession.create({
      data: {
        traineeId: trainee_id,
        scenarioId: scenario_id,
        organizationId: trainee.organizationId,
        status: 'in_progress',
      },
      include: {
        scenario: true,
        trainee: true,
      },
    });

    // Transform to match frontend type
    const transformedSession = {
      id: newSession.id,
      trainee_id: newSession.traineeId,
      scenario_id: newSession.scenarioId,
      transcript: { exchanges: [] },
      conversation_history: [],
      scores: {
        empathy: 0,
        clarity: 0,
        problem_solving: 0,
        professionalism: 0,
      },
      turns_completed: 0,
      hints_used: 0,
      status: newSession.status,
      started_at: newSession.startedAt.toISOString(),
      created_at: newSession.createdAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: transformedSession,
        message: 'Session created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

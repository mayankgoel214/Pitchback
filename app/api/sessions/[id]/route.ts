import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch session from database with related data
    const session = await prisma.trainingSession.findUnique({
      where: { id },
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
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
          message: `No session found with ID: ${id}`,
        },
        { status: 404 }
      );
    }

    // Transform to match frontend TrainingSession type
    const transformedSession = {
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
    };

    return NextResponse.json({
      success: true,
      data: transformedSession,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Find session by ID
    const session = await prisma.trainingSession.findUnique({
      where: { id },
      include: {
        conversationMessages: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
          message: `No session found with ID: ${id}`,
        },
        { status: 404 }
      );
    }

    // Handle new message
    if (body.new_message) {
      const nextTurn = session.conversationMessages.length;

      await prisma.conversationMessage.create({
        data: {
          sessionId: id,
          turn: nextTurn,
          speaker: body.new_message.speaker,
          text: body.new_message.text,
          audioUrl: body.new_message.audio_url,
          durationMs: body.new_message.duration_ms,
        },
      });
    }

    // Update session fields
    const updateData: {
      status?: string;
      completedAt?: Date;
      durationMs?: number;
    } = {};

    if (body.status) {
      updateData.status = body.status;
    }

    // If completing the session
    if (body.status === 'completed' && session.status !== 'completed') {
      updateData.completedAt = new Date();
      updateData.durationMs = Date.now() - session.startedAt.getTime();
    }

    // Update session if there are changes
    if (Object.keys(updateData).length > 0) {
      await prisma.trainingSession.update({
        where: { id },
        data: updateData,
      });
    }

    // Fetch updated session with all related data
    const updatedSession = await prisma.trainingSession.findUnique({
      where: { id },
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
    });

    // Transform to match frontend type
    const transformedSession = {
      id: updatedSession!.id,
      trainee_id: updatedSession!.traineeId,
      scenario_id: updatedSession!.scenarioId,
      transcript: {
        exchanges: updatedSession!.conversationMessages.map((msg) => ({
          speaker: msg.speaker,
          text: msg.text,
          audio_url: msg.audioUrl,
          timestamp: msg.timestamp.toISOString(),
        })),
      },
      conversation_history: updatedSession!.conversationMessages.map((msg) => ({
        role: msg.speaker === 'trainee' ? 'user' : 'assistant',
        content: msg.text,
      })),
      scores: updatedSession!.evaluation
        ? (updatedSession!.evaluation.competencyScores as Record<string, number>)
        : {
            empathy: 0,
            clarity: 0,
            problem_solving: 0,
            professionalism: 0,
          },
      overall_score: updatedSession!.evaluation?.overallScore || undefined,
      duration_seconds: updatedSession!.durationMs ? Math.round(updatedSession!.durationMs / 1000) : undefined,
      turns_completed: updatedSession!.conversationMessages.length,
      hints_used: 0,
      status: updatedSession!.status,
      started_at: updatedSession!.startedAt.toISOString(),
      completed_at: updatedSession!.completedAt?.toISOString(),
      created_at: updatedSession!.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedSession,
      message: 'Session updated successfully',
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

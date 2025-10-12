import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch scenario from database
    const scenario = await prisma.scenario.findUnique({
      where: { id },
    });

    if (!scenario) {
      return NextResponse.json(
        {
          success: false,
          error: 'Scenario not found',
          message: `No scenario found with ID: ${id}`,
        },
        { status: 404 }
      );
    }

    // Transform database record to match frontend Scenario type
    const transformedScenario = {
      id: scenario.id,
      title: scenario.title,
      description: scenario.description,
      difficulty: scenario.difficulty,
      category: scenario.category,
      scenario_type: scenario.scenarioType,
      ai_guest_persona: scenario.aiGuestPersona,
      ai_guest_opening: scenario.aiGuestOpening,
      context_background: scenario.contextBackground,
      success_criteria: scenario.successCriteria,
      evaluation_rubric: scenario.evaluationRubric,
    };

    return NextResponse.json({
      success: true,
      data: transformedScenario,
    });
  } catch (error) {
    console.error('Error fetching scenario:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch scenario',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

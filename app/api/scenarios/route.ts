import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');

    // Build where clause for Prisma query
    const where: {
      category?: string;
      difficulty?: string;
      isPublic?: boolean;
    } = {
      isPublic: true, // Only fetch public scenarios
    };

    if (category) {
      where.category = category;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Fetch scenarios from database
    const scenarios = await prisma.scenario.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform database records to match frontend Scenario type
    const transformedScenarios = scenarios.map((scenario) => ({
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
    }));

    return NextResponse.json({
      success: true,
      data: transformedScenarios,
      count: transformedScenarios.length,
    });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch scenarios',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

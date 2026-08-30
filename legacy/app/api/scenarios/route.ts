import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyAuth, requireAuth } from '@/lib/middleware/auth';
import { canCreateOrgScenario } from '@/lib/middleware/permissions';

/**
 * GET /api/scenarios - Get scenarios visible to user
 */
export async function GET(request: NextRequest) {
  try {
    // Get optional auth (scenarios can be viewed by anyone)
    const { user } = await verifyAuth(request);

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');

    // Build where clause based on user's access
    const where: any = {
      OR: [
        { visibility: 'PUBLIC' }, // Public scenarios visible to all
      ],
    };

    // Add organization and private scenarios if user is authenticated
    if (user) {
      where.OR.push(
        {
          visibility: 'ORGANIZATION',
          organizationId: user.organizationId,
        },
        {
          visibility: 'PRIVATE',
          createdById: user.id,
        }
      );
    }

    // Add filters
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
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
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
      visibility: scenario.visibility,
      created_by: scenario.createdBy?.name,
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

/**
 * POST /api/scenarios - Create new scenario (requires auth)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const {
      title,
      description,
      difficulty,
      category,
      scenarioType,
      aiGuestPersona,
      aiGuestOpening,
      contextBackground,
      successCriteria,
      evaluationRubric,
      visibility = 'PRIVATE',
    } = body;

    // Validate required fields
    if (!title || !description || !difficulty || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user can create organization-wide scenarios
    if (visibility === 'ORGANIZATION' && !canCreateOrgScenario(user)) {
      return NextResponse.json(
        { success: false, error: 'Only organization admins can create organization-wide scenarios' },
        { status: 403 }
      );
    }

    // Create scenario
    const scenario = await prisma.scenario.create({
      data: {
        title,
        description,
        difficulty,
        category,
        scenarioType: scenarioType || 'general',
        aiGuestPersona: typeof aiGuestPersona === 'string' ? aiGuestPersona : JSON.stringify(aiGuestPersona),
        aiGuestOpening: aiGuestOpening || '',
        contextBackground: contextBackground || '',
        successCriteria: successCriteria || {},
        evaluationRubric: evaluationRubric || {},
        visibility,
        createdById: user.id,
        organizationId: visibility === 'ORGANIZATION' ? user.organizationId : null,
      },
    });

    return NextResponse.json({
      success: true,
      scenario,
    });
  } catch (error: any) {
    console.error('Error creating scenario:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create scenario',
      },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyAuth, requireAuth } from '@/lib/middleware/auth';
import { canViewScenario, canEditScenario, canDeleteScenario } from '@/lib/middleware/permissions';

/**
 * GET /api/scenarios/[id] - Get scenario by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await verifyAuth(request);

    const scenario = await prisma.scenario.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!scenario) {
      return NextResponse.json(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    // Check if user can view this scenario
    const canView = await canViewScenario(id, user);
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to view this scenario' },
        { status: 403 }
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
      visibility: scenario.visibility,
      created_by: scenario.createdBy?.name,
    };

    return NextResponse.json({
      success: true,
      data: transformedScenario,
    });
  } catch (error) {
    console.error('Error fetching scenario:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scenario' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/scenarios/[id] - Update scenario
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    const body = await request.json();

    // Check if user can edit this scenario
    const canEdit = await canEditScenario(id, user);
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to edit this scenario' },
        { status: 403 }
      );
    }

    // Update scenario
    const updatedScenario = await prisma.scenario.update({
      where: { id },
      data: {
        ...body,
        // Ensure persona is stringified if it's an object
        aiGuestPersona: typeof body.aiGuestPersona === 'string'
          ? body.aiGuestPersona
          : body.aiGuestPersona ? JSON.stringify(body.aiGuestPersona) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      scenario: updatedScenario,
    });
  } catch (error: any) {
    console.error('Error updating scenario:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update scenario' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scenarios/[id] - Delete scenario
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);

    // Check if user can delete this scenario
    const canDelete = await canDeleteScenario(id, user);
    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this scenario' },
        { status: 403 }
      );
    }

    await prisma.scenario.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Scenario deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting scenario:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete scenario' },
      { status: 500 }
    );
  }
}

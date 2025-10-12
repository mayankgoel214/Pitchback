import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireOrgAdmin } from '@/lib/middleware/auth';

/**
 * POST /api/organizations/[id]/members - Add member to organization (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireOrgAdmin(request);
    const orgId = params.id;

    // Verify admin belongs to this organization
    if (user.organizationId !== orgId) {
      return NextResponse.json(
        { success: false, error: 'You can only add members to your own organization' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, makeAdmin } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user's organization
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        organizationId: orgId,
        isOrgAdmin: makeAdmin || false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isOrgAdmin: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to add member',
      },
      { status: error.message === 'Organization admin access required' ? 403 : 500 }
    );
  }
}

/**
 * PATCH /api/organizations/[id]/members - Update member role (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireOrgAdmin(request);
    const orgId = params.id;

    if (user.organizationId !== orgId) {
      return NextResponse.json(
        { success: false, error: 'You can only manage members in your own organization' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, isOrgAdmin, role } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (typeof isOrgAdmin === 'boolean') {
      updateData.isOrgAdmin = isOrgAdmin;
    }
    if (role) {
      updateData.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isOrgAdmin: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update member',
      },
      { status: 500 }
    );
  }
}

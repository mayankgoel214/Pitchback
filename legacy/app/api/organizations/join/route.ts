import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/middleware/auth';

/**
 * POST /api/organizations/join - Join an organization with invite code
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json(
        { success: false, error: 'Invite code is required' },
        { status: 400 }
      );
    }

    // Find organization by invite code
    const organization = await prisma.organization.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Invalid invite code. Please check and try again.' },
        { status: 404 }
      );
    }

    // Check if user is trying to join their current organization
    if (organization.id === user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'You are already a member of this organization' },
        { status: 400 }
      );
    }

    // Get current organization details
    const currentOrg = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      include: {
        users: {
          select: {
            id: true,
            isOrgAdmin: true,
          },
        },
      },
    });

    if (!currentOrg) {
      return NextResponse.json(
        { success: false, error: 'Current organization not found' },
        { status: 404 }
      );
    }

    // Check if user is the only member of current org
    if (currentOrg.users.length === 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot join another organization as you are the only member of your current organization. Please delete your current organization first.',
        },
        { status: 400 }
      );
    }

    // Check if user is the only admin of current org
    const admins = currentOrg.users.filter((u) => u.isOrgAdmin);
    if (user.isOrgAdmin && admins.length === 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot join another organization as you are the only admin of your current organization. Please promote another member to admin first.',
        },
        { status: 400 }
      );
    }

    // Update user's organization (not admin in new org)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        organizationId: organization.id,
        isOrgAdmin: false, // Reset admin status when joining new org
      },
      include: {
        organization: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      organization: updatedUser.organization,
      message: `Successfully joined ${organization.name}`,
    });
  } catch (error: any) {
    console.error('Error joining organization:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to join organization',
      },
      { status: 500 }
    );
  }
}

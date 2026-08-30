import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/middleware/auth';

/**
 * POST /api/organizations/leave - Leave current organization
 * User must not be the only admin or only member
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Get organization details
    const organization = await prisma.organization.findUnique({
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

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if user is the only member
    if (organization.users.length === 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot leave organization as you are the only member. Please delete the organization instead.',
        },
        { status: 400 }
      );
    }

    // Check if user is the only admin
    const admins = organization.users.filter((u) => u.isOrgAdmin);
    if (user.isOrgAdmin && admins.length === 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot leave organization as you are the only admin. Please promote another member to admin first.',
        },
        { status: 400 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: user.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully left organization',
    });
  } catch (error: any) {
    console.error('Error leaving organization:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to leave organization',
      },
      { status: 500 }
    );
  }
}

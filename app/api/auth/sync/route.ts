import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Sync Firebase user with database
 * Called after successful Firebase signup
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firebaseUid, email, name, organizationName, organizationType, isNewOrg } = body;

    // Validate required fields
    if (!firebaseUid || !email || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: firebaseUid },
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        user: existingUser,
        message: 'User already exists',
      });
    }

    let organizationId: string;

    if (isNewOrg) {
      // Create new organization
      if (!organizationName || !organizationType) {
        return NextResponse.json(
          { success: false, error: 'Organization name and type required for new organization' },
          { status: 400 }
        );
      }

      const organization = await prisma.organization.create({
        data: {
          name: organizationName,
          type: organizationType,
          inviteCode: generateInviteCode(),
        },
      });

      organizationId = organization.id;
    } else {
      // Join existing organization
      // For now, we'll create a default organization if none specified
      // In production, you'd handle invite codes here
      return NextResponse.json(
        { success: false, error: 'Joining existing organizations not yet implemented' },
        { status: 400 }
      );
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        id: firebaseUid,
        email,
        name,
        role: 'trainee',
        isOrgAdmin: isNewOrg, // First user in new org becomes admin
        organizationId,
      },
      include: {
        organization: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
      organization: user.organization,
    });
  } catch (error: any) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync user',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a random 6-character invite code
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

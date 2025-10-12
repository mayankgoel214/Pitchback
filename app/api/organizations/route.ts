import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/middleware/auth';

/**
 * GET /api/organizations - Get user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isOrgAdmin: true,
            createdAt: true,
          },
        },
        scenarios: {
          where: {
            visibility: 'ORGANIZATION',
          },
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            difficulty: true,
            createdAt: true,
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

    return NextResponse.json({
      success: true,
      organization,
    });
  } catch (error: any) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch organization',
      },
      { status: 401 }
    );
  }
}

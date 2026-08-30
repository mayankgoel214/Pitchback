import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string; // Firebase UID
    email: string;
    name: string;
    role: string;
    isOrgAdmin: boolean;
    organizationId: string;
  };
}

/**
 * Verify Firebase token and load user from database
 * This is a simple version that reads from Authorization header
 * In production, you'd verify the Firebase token server-side
 */
export async function verifyAuth(request: NextRequest): Promise<{
  user: AuthenticatedRequest['user'];
  error?: string;
}> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: undefined, error: 'No authorization token provided' };
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      return { user: undefined, error: 'Invalid authorization token' };
    }

    // In a real implementation, you would verify the Firebase token here
    // For now, we'll extract the UID from the token (this is simplified)
    // You should use firebase-admin to verify the token properly

    // Parse the token to get user ID (in production, use firebase-admin)
    // For now, we'll decode the JWT payload manually (NOT SECURE FOR PRODUCTION)
    let firebaseUid: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      firebaseUid = payload.user_id || payload.sub;
    } catch {
      return { user: undefined, error: 'Invalid token format' };
    }

    // Load user from database
    const user = await prisma.user.findUnique({
      where: { id: firebaseUid },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isOrgAdmin: true,
        organizationId: true,
      },
    });

    if (!user) {
      return { user: undefined, error: 'User not found in database' };
    }

    return { user };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { user: undefined, error: 'Authentication failed' };
  }
}

/**
 * Helper to get authenticated user or throw error
 */
export async function requireAuth(request: NextRequest): Promise<NonNullable<AuthenticatedRequest['user']>> {
  const { user, error } = await verifyAuth(request);

  if (!user) {
    throw new Error(error || 'Authentication required');
  }

  return user;
}

/**
 * Check if user is an organization admin
 */
export async function requireOrgAdmin(request: NextRequest): Promise<NonNullable<AuthenticatedRequest['user']>> {
  const user = await requireAuth(request);

  if (!user.isOrgAdmin) {
    throw new Error('Organization admin access required');
  }

  return user;
}

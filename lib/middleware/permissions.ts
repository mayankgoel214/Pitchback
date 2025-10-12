import { prisma } from '@/lib/db/prisma';
import { AuthenticatedRequest } from './auth';

export type ScenarioVisibility = 'PUBLIC' | 'ORGANIZATION' | 'PRIVATE';

/**
 * Check if user can view a scenario
 */
export async function canViewScenario(
  scenarioId: string,
  user: AuthenticatedRequest['user']
): Promise<boolean> {
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    select: {
      visibility: true,
      organizationId: true,
      createdById: true,
    },
  });

  if (!scenario) {
    return false;
  }

  // Public scenarios can be viewed by anyone
  if (scenario.visibility === 'PUBLIC') {
    return true;
  }

  // Must be authenticated for org and private scenarios
  if (!user) {
    return false;
  }

  // Organization scenarios can be viewed by org members
  if (scenario.visibility === 'ORGANIZATION') {
    return scenario.organizationId === user.organizationId;
  }

  // Private scenarios can only be viewed by creator
  if (scenario.visibility === 'PRIVATE') {
    return scenario.createdById === user.id;
  }

  return false;
}

/**
 * Check if user can edit a scenario
 */
export async function canEditScenario(
  scenarioId: string,
  user: AuthenticatedRequest['user']
): Promise<boolean> {
  if (!user) {
    return false;
  }

  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    select: {
      createdById: true,
      organizationId: true,
      visibility: true,
    },
  });

  if (!scenario) {
    return false;
  }

  // Creator can always edit their scenarios
  if (scenario.createdById === user.id) {
    return true;
  }

  // Org admins can edit organization-level scenarios
  if (user.isOrgAdmin && scenario.visibility === 'ORGANIZATION' && scenario.organizationId === user.organizationId) {
    return true;
  }

  return false;
}

/**
 * Check if user can delete a scenario
 */
export async function canDeleteScenario(
  scenarioId: string,
  user: AuthenticatedRequest['user']
): Promise<boolean> {
  // Same rules as editing
  return canEditScenario(scenarioId, user);
}

/**
 * Check if user can create organization-wide scenarios
 */
export function canCreateOrgScenario(user: AuthenticatedRequest['user']): boolean {
  if (!user) {
    return false;
  }
  return user.isOrgAdmin;
}

/**
 * Get scenarios visible to user
 */
export async function getVisibleScenariosForUser(user: AuthenticatedRequest['user'] | undefined) {
  const where: any = {
    OR: [
      // Public scenarios visible to all
      { visibility: 'PUBLIC' },
    ],
  };

  if (user) {
    where.OR.push(
      // Organization scenarios for user's org
      {
        visibility: 'ORGANIZATION',
        organizationId: user.organizationId,
      },
      // User's private scenarios
      {
        visibility: 'PRIVATE',
        createdById: user.id,
      }
    );
  }

  return prisma.scenario.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
  });
}

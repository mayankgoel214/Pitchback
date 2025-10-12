import { PrismaClient } from '@prisma/client';

// PrismaClient singleton to prevent multiple instances in development
// This is important for Next.js hot-reloading

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Helper function to ensure database connection
export async function ensureDatabaseConnection() {
  try {
    await prisma.$connect();
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
}

// Helper function to safely disconnect (useful for cleanup)
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

/**
 * Prisma Client Singleton
 * Ensures single instance of Prisma Client across the application
 * Prevents exhausting database connections in development
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaClientSingleton = () => {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch (e) {
    console.error('Failed to initialize Prisma Client:', e);
    // Return a dummy object to satisfy build requirements if init fails
    return {} as unknown as PrismaClient;
  }
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

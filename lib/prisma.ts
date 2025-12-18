/**
 * Prisma Client Singleton
 * 
 * Creates a single Prisma client instance for use across the application.
 * Prevents multiple instances in development with hot reloading.
 * 
 * AI Note: Import this in tRPC routers and other server-side code.
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}


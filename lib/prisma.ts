/**
 * Prisma Client Singleton
 * 
 * Creates a single Prisma client instance for use across the application.
 * Prevents multiple instances in development with hot reloading.
 * 
 * AI Note: Import this in tRPC routers and other server-side code.
 * 
 * Configured for serverless environments (Vercel) to avoid prepared statement conflicts.
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Transaction pooler doesn't support PREPARE statements
// Add ?pgbouncer=true to disable prepared statements when using pooler
// Also add SSL mode and connection limit for serverless environments
const databaseUrl = process.env.DATABASE_URL
let poolerUrl = databaseUrl

if (databaseUrl?.includes('pooler.supabase.com')) {
  // Supabase pooler configuration
  poolerUrl = `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}pgbouncer=true&sslmode=require&connection_limit=1&connect_timeout=10&pool_timeout=10`
} else if (databaseUrl && !databaseUrl.includes('connect_timeout')) {
  // Add connection timeout for local/docker databases to prevent startup freeze
  // 5s = fail fast when DB is down; wait-for-db.sh ensures DB is ready before app starts
  poolerUrl = `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}connect_timeout=5`
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: poolerUrl,
    },
  },
})

// In serverless environments, reuse the same Prisma client instance
// This is critical for connection pooling in Vercel/serverless
if (process.env.NODE_ENV === 'production') {
  // In production (Vercel), reuse the global instance to prevent connection exhaustion
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prisma
  }
} else {
  // In development, also reuse to prevent multiple instances during hot reload
  globalForPrisma.prisma = prisma
}


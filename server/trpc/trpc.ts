/**
 * tRPC Setup
 * 
 * Core tRPC configuration with superjson for date/Map/Set serialization.
 * 
 * AI Note: This is the base tRPC setup. Routers are defined in separate files
 * under server/trpc/routers/
 */

import { initTRPC } from '@trpc/server'
import superjson from 'superjson'

const t = initTRPC.create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure


/**
 * Zone Router
 * 
 * tRPC procedures for zone operations.
 */

import { z } from 'zod'
import { router, publicProcedure } from '../trpc'

export const zoneRouter = router({
  list: publicProcedure
    .input(z.object({
      siteId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // TODO: Implement zone list
      return []
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string(),
      siteId: z.string(),
      deviceIds: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      // TODO: Implement zone creation
      return { id: 'placeholder' }
    }),
})


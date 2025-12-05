/**
 * Rule Router
 * 
 * tRPC procedures for rules and overrides.
 */

import { z } from 'zod'
import { router, publicProcedure } from '../trpc'

export const ruleRouter = router({
  list: publicProcedure
    .input(z.object({
      siteId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // TODO: Implement rule list
      return []
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string(),
      trigger: z.string(),
      condition: z.any(),
      action: z.any(),
      overrideBMS: z.boolean().default(false),
      duration: z.number().optional(),
      zoneId: z.string().optional(),
      targetZones: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      // TODO: Implement rule creation
      return { id: 'placeholder' }
    }),
})


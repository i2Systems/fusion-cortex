/**
 * BACnet Mapping Router
 * 
 * tRPC procedures for BACnet mapping operations.
 */

import { z } from 'zod'
import { router, publicProcedure } from '../trpc'

export const bacnetRouter = router({
  list: publicProcedure
    .input(z.object({
      siteId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // TODO: Implement BACnet mapping list
      return []
    }),

  update: publicProcedure
    .input(z.object({
      zoneId: z.string(),
      bacnetObjectId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Implement BACnet mapping update
      return { success: true }
    }),
})


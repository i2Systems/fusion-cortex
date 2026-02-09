import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { TRPCError } from '@trpc/server'
import { withRetry, withRetryList } from '../utils/withRetry'

export const locationRouter = router({
    // List locations for a site (bases and their children)
    list: publicProcedure
        .input(z.object({
            siteId: z.string(),
        }))
        .query(async ({ input }) => {
            try {
                const locations = await withRetryList(() => prisma.location.findMany({
                    where: { siteId: input.siteId },
                    orderBy: { createdAt: 'desc' },
                }), 'location.list')

                // Sort: bases first, then by date
                // We can do client-side hierarchical sorting if needed, 
                // but returning flat list is fine as long as parentId is there
                return locations
            } catch (error: any) {
                console.error('Error fetching locations:', error)
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Failed to fetch locations: ${error.message}`,
                })
            }
        }),

    // Create a new location
    create: publicProcedure
        .input(z.object({
            siteId: z.string(),
            name: z.string(),
            type: z.enum(['base', 'zoom']),
            parentId: z.string().optional(),
            imageUrl: z.string().optional(),
            vectorDataUrl: z.string().optional(),
            zoomBounds: z.any().optional(), // Json
        }))
        .mutation(async ({ input }) => {
            // Validate site exists
            const site = await withRetry(() => prisma.site.findUnique({
                where: { id: input.siteId },
            }), { context: 'location.create.checkSite' })
            if (!site) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Site not found',
                })
            }

            // Create location
            const location = await withRetry(() => prisma.location.create({
                data: {
                    id: randomUUID(),
                    siteId: input.siteId,
                    name: input.name,
                    type: input.type,
                    parentId: input.parentId,
                    imageUrl: input.imageUrl,
                    vectorDataUrl: input.vectorDataUrl,
                    zoomBounds: input.zoomBounds,
                    updatedAt: new Date(),
                },
            }), { context: 'location.create' })

            return location
        }),

    // Update a location
    update: publicProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().optional(),
            imageUrl: z.string().optional(),
            vectorDataUrl: z.string().optional(),
            zoomBounds: z.any().optional(),
        }))
        .mutation(async ({ input }) => {
            const { id, ...updates } = input

            const location = await withRetry(() => prisma.location.update({
                where: { id },
                data: updates,
            }), { context: 'location.update' })

            return location
        }),

    // Delete a location
    delete: publicProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ input }) => {
            // Cascading delete is handled by database schema
            await withRetry(() => prisma.location.delete({
                where: { id: input.id },
            }), { context: 'location.delete' })
            return { success: true }
        }),
})

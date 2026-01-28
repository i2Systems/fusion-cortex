import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { logger } from '@/lib/logger'

// Input schemas
const createPersonSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().optional().or(z.literal('')),
    role: z.string().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    siteId: z.string(),
})

const updatePersonSchema = z.object({
    id: z.string(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional().or(z.literal('')),
    role: z.string().optional(),
    imageUrl: z.string().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
})

export const personRouter = router({
    get: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            return await prisma.person.findUnique({
                where: { id: input.id }
            })
        }),

    list: publicProcedure
        .input(z.object({ siteId: z.string() }))
        .query(async ({ input }) => {
            return await prisma.person.findMany({
                where: { siteId: input.siteId },
                orderBy: { createdAt: 'desc' }
            })
        }),

    create: publicProcedure
        .input(createPersonSchema)
        .mutation(async ({ input }) => {
            return await prisma.person.create({
                data: {
                    id: randomUUID(),
                    ...input,
                    updatedAt: new Date()
                }
            })
        }),

    update: publicProcedure
        .input(updatePersonSchema)
        .mutation(async ({ input }) => {
            const { id, ...data } = input
            return await prisma.person.update({
                where: { id },
                data: {
                    ...data,
                    updatedAt: new Date()
                }
            })
        }),

    delete: publicProcedure
        .input(z.string())
        .mutation(async ({ input }) => {
            return await prisma.person.delete({
                where: { id: input }
            })
        }),

    // Save person image to database (stored in imageUrl field)
    saveImage: publicProcedure
        .input(z.object({
            personId: z.string(),
            imageData: z.string(), // Base64 encoded image
            mimeType: z.string().optional().default('image/jpeg'),
        }))
        .mutation(async ({ input }) => {
            const MAX_RETRIES = 3
            let lastError: any = null

            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                try {
                    // Verify person exists
                    const personExists = await prisma.person.findUnique({
                        where: { id: input.personId },
                        select: { id: true },
                    })

                    if (!personExists) {
                        throw new Error(`Person with ID ${input.personId} not found`)
                    }

                    // Store imageUrl directly in database (base64 or URL)
                    // For now, we'll store as base64. If Supabase is configured, could upload there first.
                    let imageUrl = input.imageData // Default to base64

                    // Update person with imageUrl
                    const person = await prisma.person.update({
                        where: { id: input.personId },
                        data: { imageUrl },
                    })

                    logger.info(`Person image saved for ${input.personId}`)
                    return person
                } catch (error: any) {
                    lastError = error
                    logger.error(`Error saving person image to database (attempt ${attempt + 1}):`, error)

                    // Handle missing column error
                    if (error.code === 'P2022' && error.meta?.column === 'Person.imageUrl') {
                        logger.warn('imageUrl column missing, attempting to add it...')
                        try {
                            await prisma.$executeRaw`ALTER TABLE "Person" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT`
                            // Retry the update
                            const person = await prisma.person.update({
                                where: { id: input.personId },
                                data: { imageUrl: input.imageData },
                            })
                            logger.info(`Person image saved for ${input.personId} (after adding column)`)
                            return person
                        } catch (addColumnError: any) {
                            logger.error('Failed to add imageUrl column:', addColumnError)
                            if (attempt < MAX_RETRIES - 1) continue
                            throw new Error('Database schema update required. Please run migrations: npx prisma db push')
                        }
                    }

                    // Handle person not found
                    if (error.code === 'P2025') {
                        throw new Error(`Person with ID ${input.personId} not found`)
                    }

                    // Handle prepared statement errors
                    if (error.code === '26000' || error.code === '42P05' || error.message?.includes('prepared statement')) {
                        if (attempt < MAX_RETRIES - 1) continue
                    }

                    // If not a retryable error, throw immediately
                    if (attempt < MAX_RETRIES - 1) continue
                }
            }

            throw new Error(`Failed to save person image after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`)
        }),
})

/**
 * Image Router
 * 
 * tRPC procedures for storing and retrieving images in Supabase database.
 * Handles both site images and library object images.
 */

import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'

export const imageRouter = router({
  // Save site image to database
  saveSiteImage: publicProcedure
    .input(z.object({
      siteId: z.string(),
      imageData: z.string(), // Base64 encoded image
      mimeType: z.string().optional().default('image/jpeg'),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`💾 Saving site image to database for ${input.siteId}, size: ${input.imageData.length} chars`)
        
        // Update site with imageUrl
        const site = await prisma.site.update({
          where: { id: input.siteId },
          data: { imageUrl: input.imageData },
        })
        
        console.log(`✅ Site image saved to database for ${input.siteId}`)
        return { success: true, siteId: input.siteId }
      } catch (error: any) {
        console.error('Error saving site image to database:', error)
        
        // Handle missing column error
        if (error.code === 'P2022' && error.meta?.column === 'Site.imageUrl') {
          console.warn('imageUrl column missing, attempting to add it...')
          // Try to add the column using raw SQL
          try {
            await prisma.$executeRaw`ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT`
            // Retry the update
            const site = await prisma.site.update({
              where: { id: input.siteId },
              data: { imageUrl: input.imageData },
            })
            return { success: true, siteId: input.siteId }
          } catch (addColumnError) {
            console.error('Failed to add imageUrl column:', addColumnError)
            throw new Error('Database schema update required. Please run migrations.')
          }
        }
        
        // Handle site not found
        if (error.code === 'P2025') {
          throw new Error(`Site with ID ${input.siteId} not found`)
        }
        
        throw new Error(`Failed to save site image: ${error.message}`)
      }
    }),

  // Get site image from database
  getSiteImage: publicProcedure
    .input(z.object({
      siteId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const site = await prisma.site.findUnique({
          where: { id: input.siteId },
          select: { imageUrl: true },
        })
        
        return site?.imageUrl || null
      } catch (error: any) {
        console.error('Error getting site image from database:', error)
        
        // Handle missing column error
        if (error.code === 'P2022' && error.meta?.column === 'Site.imageUrl') {
          return null
        }
        
        return null
      }
    }),

  // Save library object image to database
  saveLibraryImage: publicProcedure
    .input(z.object({
      libraryId: z.string(),
      imageData: z.string(), // Base64 encoded image
      mimeType: z.string().optional().default('image/jpeg'),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`💾 Saving library image to database for ${input.libraryId}, size: ${input.imageData.length} chars`)
        
        // Upsert library image (create or update)
        const libraryImage = await prisma.libraryImage.upsert({
          where: { libraryId: input.libraryId },
          update: {
            imageData: input.imageData,
            mimeType: input.mimeType,
            updatedAt: new Date(),
          },
          create: {
            libraryId: input.libraryId,
            imageData: input.imageData,
            mimeType: input.mimeType,
          },
        })
        
        console.log(`✅ Library image saved to database for ${input.libraryId}`)
        return { success: true, libraryId: input.libraryId }
      } catch (error: any) {
        console.error('Error saving library image to database:', error)
        throw new Error(`Failed to save library image: ${error.message}`)
      }
    }),

  // Get library object image from database
  getLibraryImage: publicProcedure
    .input(z.object({
      libraryId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const libraryImage = await prisma.libraryImage.findUnique({
          where: { libraryId: input.libraryId },
          select: { imageData: true, mimeType: true },
        })
        
        return libraryImage?.imageData || null
      } catch (error: any) {
        console.error('Error getting library image from database:', error)
        return null
      }
    }),

  // Remove library image from database
  removeLibraryImage: publicProcedure
    .input(z.object({
      libraryId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await prisma.libraryImage.delete({
          where: { libraryId: input.libraryId },
        })
        
        return { success: true }
      } catch (error: any) {
        // Ignore if image doesn't exist
        if (error.code === 'P2025') {
          return { success: true }
        }
        console.error('Error removing library image from database:', error)
        throw new Error(`Failed to remove library image: ${error.message}`)
      }
    }),
})


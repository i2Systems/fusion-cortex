/**
 * Migration endpoint to create LibraryImage table
 * Run this once to add the LibraryImage model to production database
 */

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('Creating LibraryImage table...')
    
    // Create the LibraryImage table using raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "LibraryImage" (
        "id" TEXT NOT NULL,
        "libraryId" TEXT NOT NULL,
        "imageData" TEXT NOT NULL,
        "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "LibraryImage_pkey" PRIMARY KEY ("id")
      )
    `
    
    // Create unique index on libraryId
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "LibraryImage_libraryId_key" ON "LibraryImage"("libraryId")
    `
    
    // Create index on libraryId for faster lookups
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "LibraryImage_libraryId_idx" ON "LibraryImage"("libraryId")
    `
    
    console.log('✅ LibraryImage table created successfully')
    
    return NextResponse.json({ success: true, message: 'LibraryImage table created' })
  } catch (error: any) {
    console.error('Error creating LibraryImage table:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'POST to this endpoint to create LibraryImage table' })
}


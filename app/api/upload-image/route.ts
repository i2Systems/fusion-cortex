/**
 * Image Upload API Route
 *
 * Uploads images to Supabase Storage and returns the public URL.
 * Falls back to base64 storage if Supabase is not configured.
 *
 * Security features:
 * - File size limits (10MB max)
 * - File type validation (images only)
 * - Bucket whitelist validation
 * - Basic rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin, STORAGE_BUCKETS } from '@/lib/supabase'

// ============================================================================
// CONFIGURATION
// ============================================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const

// Valid bucket names from STORAGE_BUCKETS
const VALID_BUCKETS = Object.values(STORAGE_BUCKETS) as readonly string[]

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20 // 20 requests per minute

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const BucketSchema = z.enum([
  STORAGE_BUCKETS.SITE_IMAGES,
  STORAGE_BUCKETS.LIBRARY_IMAGES,
  STORAGE_BUCKETS.MAP_DATA,
])

const FileNameSchema = z
  .string()
  .min(1, 'fileName is required')
  .max(255, 'fileName too long')
  .regex(/^[a-zA-Z0-9_\-./]+$/, 'fileName contains invalid characters')

// ============================================================================
// SIMPLE IN-MEMORY RATE LIMITER
// Note: For production with multiple instances, use Redis-based rate limiting
// like @upstash/ratelimit or similar
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(identifier: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetAt) {
    // Reset or create new record
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    })
    return false
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true
  }

  record.count++
  return false
}

// Clean up old entries periodically (prevent memory leak)
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, RATE_LIMIT_WINDOW_MS)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getClientIdentifier(request: NextRequest): string {
  // Use IP address or forwarded header for identification
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
  return `upload:${ip}`
}

function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientId = getClientIdentifier(request)
    if (isRateLimited(clientId)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file')
    const bucketRaw = formData.get('bucket')
    const fileNameRaw = formData.get('fileName')

    // Validate file exists and is a File object
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided or invalid file format' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type || !isValidMimeType(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Validate bucket with Zod
    const bucketResult = BucketSchema.safeParse(bucketRaw)
    if (!bucketResult.success) {
      return NextResponse.json(
        { error: `Invalid bucket. Allowed: ${VALID_BUCKETS.join(', ')}` },
        { status: 400 }
      )
    }
    const bucket = bucketResult.data

    // Validate fileName with Zod
    const fileNameResult = FileNameSchema.safeParse(fileNameRaw)
    if (!fileNameResult.success) {
      return NextResponse.json(
        { error: fileNameResult.error.errors[0]?.message || 'Invalid fileName' },
        { status: 400 }
      )
    }
    const fileName = fileNameResult.data

    // Check if Supabase is configured
    if (!supabaseAdmin) {
      // Fallback: return base64 data URL
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const mimeType = file.type || 'image/jpeg'
      const dataUrl = `data:${mimeType};base64,${base64}`

      return NextResponse.json({
        url: dataUrl,
        fallback: true,
        message: 'Supabase not configured, using base64 fallback',
      })
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true, // Replace if exists
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json(
        { error: 'Failed to upload file' }, // Don't expose internal error details
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return NextResponse.json({
      url: urlData.publicUrl,
      path: data.path,
    })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' }, // Don't expose internal error details
      { status: 500 }
    )
  }
}

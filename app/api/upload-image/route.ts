/**
 * Image Upload API Route
 * 
 * Uploads images to Supabase Storage and returns the public URL.
 * Falls back to base64 storage if Supabase is not configured.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, STORAGE_BUCKETS } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bucket = formData.get('bucket') as string
    const fileName = formData.get('fileName') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!bucket || !fileName) {
      return NextResponse.json({ error: 'Bucket and fileName are required' }, { status: 400 })
    }

    // Validate bucket name
    if (!Object.values(STORAGE_BUCKETS).includes(bucket as any)) {
      return NextResponse.json({ error: 'Invalid bucket name' }, { status: 400 })
    }

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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return NextResponse.json({
      url: urlData.publicUrl,
      path: data.path,
    })
  } catch (error: any) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}


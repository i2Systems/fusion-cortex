# Supabase Storage Setup Guide

This project uses Supabase Storage for image hosting (free tier). Images are optimized and stored as URLs in the database instead of base64 strings.

## Setup Steps

### 1. Create Supabase Project (if you don't have one)

1. Go to https://supabase.com
2. Create a new project (or use existing)
3. Wait for project to be ready

### 2. Create Storage Buckets

1. Go to **Storage** in your Supabase dashboard
2. Create two public buckets:
   - **Bucket name**: `site-images`
     - Make it **Public** (so images can be accessed via URL)
   - Enable **Public bucket** option
   - Click **Create bucket**
   
   - **Bucket name**: `library-images`
     - Make it **Public**
     - Enable **Public bucket** option
     - Click **Create bucket**

### 3. Get Your Supabase Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - **Keep this secret!**

### 4. Set Environment Variables

Add these to your `.env` file (or Vercel environment variables):

```env
# Supabase Storage (for image hosting)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (anon/public key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service_role key - server-side only)
```

**For Vercel:**
1. Go to your project settings
2. Add these environment variables
3. Redeploy

### 5. Run Database Migration

The schema has been updated to use `imageUrl` instead of `imageData`:

```bash
npx prisma db push
```

Or create a migration:
```bash
npx prisma migrate dev --name use_image_urls
```

## How It Works

1. **Image Upload**: When an image is uploaded:
   - Client compresses image (400px max, 0.6 quality, 200KB max)
   - Sends base64 to server
   - Server uploads to Supabase Storage
   - Server saves URL in database (or base64 if Supabase not configured)

2. **Image Retrieval**: 
   - Server returns URL from database
   - Frontend displays image from URL (or base64 fallback)
   - Images are served via Supabase CDN

3. **Fallback**: If Supabase is not configured, images are stored as base64 in the database (old behavior)

## Free Tier Limits

- **Storage**: 1GB free
- **Bandwidth**: 2GB/month free
- **Files**: Unlimited

For most use cases, this is sufficient. Images are optimized to ~50-150KB each.

## Troubleshooting

**Images not uploading?**
- Check Supabase credentials in `.env`
- Verify buckets are created and public
- Check server logs for upload errors

**Images not displaying?**
- Verify bucket is set to **Public**
- Check that URLs are being saved to database
- Check browser console for CORS errors

**Still using base64?**
- Supabase not configured → using fallback
- Check environment variables are set correctly
- Check server logs for "Supabase upload failed" messages


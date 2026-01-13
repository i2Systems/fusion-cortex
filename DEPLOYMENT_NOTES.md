# Production Database Setup

## Quick Setup (After First Deployment)

After setting DATABASE_URL in Vercel, you need to sync the database schema.

### Option 1: Push Schema (Recommended for Fresh Database)

```bash
# Get your production DATABASE_URL from Vercel
# Vercel Dashboard → Your Project → Settings → Environment Variables

# Then run locally:
DATABASE_URL="your-production-database-url" npx prisma db push
```

### Option 2: Use Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.production

# Push schema to production database
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2) npx prisma db push
```

### Option 3: Run via Vercel CLI (Remote)

```bash
# Run command in Vercel environment
vercel env pull
npx prisma db push
```

## Important Notes

- **Never use `--force-reset` in production** - it will delete all data
- Use `prisma db push` for development/testing
- Use `prisma migrate deploy` for production with migrations
- Make sure DATABASE_URL is correctly set in Vercel

## Verify Schema

After pushing, verify the schema is correct:

```bash
DATABASE_URL="your-production-url" npx prisma db pull --print
```

This should show your current Prisma schema.

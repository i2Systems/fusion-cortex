# 🚀 Deployment Checklist - Ready to Deploy

> **Created**: January 28, 2026  
> **Status**: ✅ Build passes, migrations ready

## Quick Answer to Your Question

**YES, you need to update the Vercel Supabase backend** to match your local database schema. The production database needs to have the same migrations applied that you have locally.

---

## ✅ Pre-Deployment Status

- ✅ **TypeScript**: Compiles without errors
- ✅ **Build**: Succeeds locally (`npm run build`)
- ✅ **Migrations**: New migrations for Groups and People are ready
- ⚠️ **Action Required**: Run migrations on production database

---

## 📋 Step-by-Step Deployment Guide

### Step 1: Verify Local Changes

All your changes are ready:
- New Groups and People features
- Database migrations in `prisma/migrations/`
- All code changes committed (or ready to commit)

### Step 2: Commit and Push to GitHub

```bash
# Review what will be committed
git status

# Add all changes (or selectively add files)
git add .

# Commit with descriptive message
git commit -m "Add Groups and People features with database migrations"

# Push to GitHub (this will trigger Vercel deployment)
git push origin main
```

**Note**: Vercel will automatically deploy when you push to `main` branch.

### Step 3: Apply Migrations to Production Database ⚠️ **CRITICAL**

**You MUST run migrations on your production Supabase database** before the new code works properly.

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project (if not already linked)
vercel link

# Pull production environment variables
vercel env pull .env.production

# Extract DATABASE_URL and run migrations
export DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"')
npx prisma migrate deploy

# Clean up
rm .env.production
```

#### Option B: Manual (Using Supabase Connection String)

1. **Get your production DATABASE_URL from Vercel**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Copy the `DATABASE_URL` value
   - **IMPORTANT**: Make sure it uses the **connection pooler** (port 6543, not 5432)
   - Format should be: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

2. **Run migrations**:
   ```bash
   DATABASE_URL="your-production-connection-string" npx prisma migrate deploy
   ```

#### Option C: Using Supabase Dashboard SQL Editor

If you prefer, you can manually run the migration SQL in Supabase Dashboard:
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of:
   - `prisma/migrations/20260127174059_add_groups_and_people/migration.sql`
   - `prisma/migrations/20260127181124_add_person_coordinates/migration.sql`
3. Run each migration SQL in order

### Step 4: Verify Environment Variables in Vercel

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and verify:

- ✅ `DATABASE_URL` - Uses connection pooler (port 6543)
- ✅ `NEXTAUTH_SECRET` - Set and unique for production
- ✅ `NEXTAUTH_URL` - Set to your production domain (e.g., `https://your-app.vercel.app`)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

### Step 5: Monitor Deployment

1. **Check Vercel Dashboard**:
   - Go to Vercel Dashboard → Your Project → Deployments
   - Watch the build logs for any errors
   - Wait for deployment to complete (usually 2-5 minutes)

2. **Check Build Logs**:
   - Look for any errors in the build output
   - Verify Prisma Client generates successfully
   - Check for any missing environment variables

### Step 6: Post-Deployment Verification

After deployment completes:

1. **Test the Application**:
   - Visit your Vercel URL
   - Test Groups feature: `/groups`
   - Test People feature: `/people`
   - Verify database queries work

2. **Check Vercel Logs**:
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for any runtime errors
   - Check for database connection errors

3. **Verify Database Schema**:
   ```bash
   # Using Vercel CLI
   vercel env pull .env.production
   export DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"')
   npx prisma db pull --print
   rm .env.production
   ```

---

## ⚠️ Important Notes

### Database Migrations

- **Migrations MUST be run on production** before the new code works
- The new code expects `Group`, `Person`, and `GroupPerson` tables to exist
- If migrations aren't run, you'll get database errors when using Groups/People features

### Connection Pooler (Critical for Vercel)

Your `DATABASE_URL` in Vercel **MUST** use Supabase's connection pooler:
- ✅ **Correct**: `postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres`
- ❌ **Wrong**: `postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres`

If you're using the direct connection (port 5432), Vercel deployments will fail with connection errors.

### Migration Order

Migrations are applied in this order:
1. `20260127174059_add_groups_and_people` - Creates Group, Person, GroupDevice tables
2. `20260127181124_add_person_coordinates` - Adds x, y coordinates to Person table
3. `20260128104012_add_group_person_junction` - Creates GroupPerson junction table

All three migrations will be applied automatically when you run `prisma migrate deploy`.

---

## 🐛 Troubleshooting

### Build Fails on Vercel

1. Check build logs in Vercel Dashboard
2. Verify all environment variables are set
3. Check that `DATABASE_URL` uses connection pooler
4. Verify Prisma schema is valid: `npx prisma validate`

### Database Connection Errors

1. Verify `DATABASE_URL` uses connection pooler (port 6543)
2. Check Supabase Dashboard → Settings → Database → Connection Pooling
3. Ensure "Use connection pooling" is enabled
4. Verify password is correct

### Migration Errors

1. Check migration files are committed to Git
2. Verify database user has migration permissions
3. Check if migrations were already applied (Prisma will skip them)
4. Review migration SQL for syntax errors

### Features Not Working After Deployment

1. **Groups/People pages show errors**:
   - Migrations weren't applied to production database
   - Run `npx prisma migrate deploy` with production DATABASE_URL

2. **Database queries fail**:
   - Check Vercel logs for specific error messages
   - Verify DATABASE_URL is correct
   - Check Supabase dashboard for connection issues

---

## ✅ Final Checklist

Before pushing:
- [ ] All changes committed to Git
- [ ] Build succeeds locally (`npm run build`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Migration files are in `prisma/migrations/`

After pushing:
- [ ] Code pushed to GitHub
- [ ] Vercel deployment triggered
- [ ] **Migrations applied to production database** ⚠️
- [ ] Environment variables verified in Vercel
- [ ] Deployment successful in Vercel Dashboard
- [ ] Application loads without errors
- [ ] Groups feature works
- [ ] People feature works

---

## 📚 Additional Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase configuration
- [Vercel Dashboard](https://vercel.com/dashboard) - Monitor deployments

---

## Quick Commands Reference

```bash
# Type check
npm run typecheck

# Build locally
npm run build

# Run migrations on production (after getting DATABASE_URL)
DATABASE_URL="your-production-url" npx prisma migrate deploy

# Verify schema
DATABASE_URL="your-production-url" npx prisma db pull --print

# Get production env vars
vercel env pull .env.production

# Manual deploy (if auto-deploy doesn't work)
vercel --prod
```

---

**Ready to deploy?** Follow the steps above, and remember: **run migrations on production database before testing the new features!**

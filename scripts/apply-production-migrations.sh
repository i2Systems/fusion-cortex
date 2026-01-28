#!/bin/bash
# Script to apply database migrations to production Supabase database
# This script uses Vercel CLI to get the production DATABASE_URL

set -e

echo "🚀 Applying migrations to production database..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

# Pull environment variables from Vercel
echo "📥 Pulling environment variables from Vercel..."
vercel env pull .env.production --yes

# Extract DATABASE_URL
if [ ! -f .env.production ]; then
    echo "❌ Failed to pull environment variables"
    exit 1
fi

DATABASE_URL=$(grep "^DATABASE_URL=" .env.production | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in Vercel environment variables"
    echo "Please set DATABASE_URL in Vercel Dashboard → Settings → Environment Variables"
    rm -f .env.production
    exit 1
fi

# Check if using connection pooler
if [[ "$DATABASE_URL" != *":6543"* ]]; then
    echo "⚠️  WARNING: DATABASE_URL doesn't appear to use connection pooler (port 6543)"
    echo "   For Vercel, you MUST use Supabase connection pooler"
    echo "   Current URL format: ${DATABASE_URL:0:50}..."
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted. Please update DATABASE_URL in Vercel to use connection pooler."
        rm -f .env.production
        exit 1
    fi
fi

echo "✅ Found DATABASE_URL"
echo ""

# Apply migrations
echo "📦 Applying migrations to production database..."
echo "   This will create: Group, Person, GroupDevice, GroupPerson tables"
echo ""

DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy

echo ""
echo "✅ Migrations applied successfully!"
echo ""

# Verify schema
echo "🔍 Verifying database schema..."
DATABASE_URL="$DATABASE_URL" npx prisma db pull --print > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database schema verified"
else
    echo "⚠️  Could not verify schema (this is okay if database is remote)"
fi

# Clean up
rm -f .env.production

echo ""
echo "🎉 Done! Your production database is now up to date."
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub: git push origin main"
echo "2. Vercel will automatically deploy"
echo "3. Test your application at your Vercel URL"

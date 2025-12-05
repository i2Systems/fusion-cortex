# Quick Setup Guide

## Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Initialize database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Project Structure Quick Reference

- **Pages**: `app/(main)/[section]/page.tsx`
- **Layout**: `app/(main)/layout.tsx` (main layout), `components/layout/` (layout components)
- **API**: `server/trpc/routers/` (tRPC routers), `app/api/trpc/[trpc]/route.ts` (API handler)
- **Database**: `prisma/schema.prisma`
- **Styles**: `app/globals.css` (design tokens)
- **Components**: `components/` (reusable components)

## Common Tasks

### Add a New Section

1. Create `app/(main)/[section]/page.tsx`
2. Add nav item to `components/layout/MainNav.tsx` (navItems array)
3. Create tRPC router in `server/trpc/routers/[section].ts`
4. Add router to `server/trpc/routers/_app.ts`

### Add a New tRPC Procedure

1. Open the relevant router in `server/trpc/routers/`
2. Add procedure using `publicProcedure.input(z.object({...})).query(...)` or `.mutation(...)`
3. Use Prisma client to interact with database
4. Call from frontend: `trpc.[router].[procedure].useQuery({...})`

### Update Design Tokens

1. Edit `app/globals.css`
2. Modify CSS custom properties in `:root`
3. Changes apply globally (no component updates needed)

## Troubleshooting

**"Module not found" errors:**
- Run `npm install` again
- Check that all dependencies in `package.json` are installed

**Database connection errors:**
- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Run `npx prisma db push` to sync schema

**tRPC type errors:**
- Run `npx prisma generate` after schema changes
- Restart dev server after adding new routers

**Styling issues:**
- Ensure you're using design tokens (`var(--color-*)`)
- Check `app/globals.css` for available tokens
- Use Tailwind for layout, custom CSS for component styling


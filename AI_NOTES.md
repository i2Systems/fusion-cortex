# AI Assistant Notes

This file contains helpful context for AI assistants working on this codebase.

## Quick Context

**Project**: Fusion/Cortex - Commissioning & Configuration UI for retail lighting
**Purpose**: Setup, mapping, and rules platform (NOT a dashboard or analytics tool)
**Tech**: Next.js 14 App Router, React, tRPC, Prisma, PostgreSQL, Tailwind

## Key Principles

1. **Always use design tokens** - Never hard-code colors/spacing. Use `var(--color-*)`, `var(--space-*)`, etc.
2. **Type safety first** - Use tRPC for all API calls, Zod for validation, TypeScript strict mode
3. **Server Components by default** - Only use `'use client'` when needed (interactivity, hooks, browser APIs)
4. **Plain language** - No jargon, simple UX (per brief requirements)

## Common Patterns

### Adding a New Section

```typescript
// 1. Create page
// app/(main)/newsection/page.tsx
export default function NewSectionPage() {
  return <div>...</div>
}

// 2. Add to nav
// components/layout/MainNav.tsx
const navItems = [
  // ... existing items
  { href: '/newsection', label: 'New Section', icon: IconName },
]

// 3. Create router
// server/trpc/routers/newsection.ts
export const newsectionRouter = router({
  list: publicProcedure.query(async () => { ... }),
})

// 4. Add to app router
// server/trpc/routers/_app.ts
export const appRouter = router({
  // ... existing routers
  newsection: newsectionRouter,
})
```

### Using tRPC in Components

```typescript
'use client'
import { trpc } from '@/lib/trpc/client'

export function MyComponent() {
  const { data, isLoading } = trpc.device.search.useQuery({ query: '765' })
  const createMutation = trpc.zone.create.useMutation()
  
  // ...
}
```

### Styling Components

```typescript
// ✅ Good - uses tokens
<div className="bg-[var(--color-surface)] p-[var(--space-6)] rounded-[var(--radius-lg)]">

// ❌ Bad - hard-coded
<div className="bg-[#111322] p-6 rounded-lg">
```

### Database Queries

```typescript
// In tRPC router
import { prisma } from '@/lib/prisma' // You'll need to create this

export const deviceRouter = router({
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return await prisma.device.findMany({
        where: { deviceId: { contains: input.query } },
      })
    }),
})
```

## File Locations

- **Pages**: `app/(main)/[section]/page.tsx`
- **Layout Components**: `components/layout/`
- **Feature Components**: `components/[feature]/`
- **tRPC Routers**: `server/trpc/routers/[feature].ts`
- **Database Schema**: `prisma/schema.prisma`
- **Design Tokens**: `app/globals.css` (look for `:root`)

## Design Token Reference

**Colors:**
- `--color-primary`: #4c7dff (main brand color)
- `--color-surface`: #111322 (card/panel backgrounds)
- `--color-text`: #f9fafb (primary text)
- `--color-text-muted`: #9ca3af (secondary text)
- `--color-success`: #22c55e
- `--color-danger`: #f97373
- `--color-warning`: #facc15

**Spacing:** `--space-1` through `--space-20` (4px base unit)

**Radius:** `--radius-xs` through `--radius-2xl`

**Shadows:** `--shadow-soft`, `--shadow-md`, `--shadow-strong`

## Common Issues & Solutions

**"Cannot find module '@/...'"**
- Check `tsconfig.json` paths configuration
- Ensure file exists at that path
- Restart TypeScript server

**tRPC type errors**
- Run `npx prisma generate` after schema changes
- Restart dev server
- Check router is added to `_app.ts`

**Styling not applying**
- Ensure using design tokens, not hard-coded values
- Check Tailwind classes are valid
- Verify `globals.css` is imported in root layout

**Database connection errors**
- Verify `DATABASE_URL` in `.env`
- Check PostgreSQL is running
- Run `npx prisma db push` to sync schema

## Non-Goals (Don't Implement)

- Energy savings charts
- Heatmaps / occupancy maps
- Analytics dashboards
- Store manager operations dashboards
- Legacy energy/analytics features

## Testing Checklist

When adding features:
- [ ] Uses design tokens (no hard-coded values)
- [ ] Type-safe (tRPC + TypeScript)
- [ ] Server Component unless client features needed
- [ ] Added to navigation if it's a main section
- [ ] tRPC router created and added to app router
- [ ] Database schema updated if needed
- [ ] Plain language, no jargon

## Next Steps for Full Implementation

1. **Connect tRPC to Prisma**: Create `lib/prisma.ts`, use in routers
2. **Implement discovery logic**: Device scanning, status tracking
3. **Map canvas**: Blueprint upload, device rendering, interactions
4. **Zone management**: Create/edit zones, device assignment
5. **Rule engine**: Rule builder, evaluation, BMS integration
6. **Auth setup**: Configure Auth.js, protect routes
7. **Real-time updates**: WebSockets or polling for device status


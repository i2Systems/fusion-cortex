# AI Assistant Notes

**Quick Context**: Fusion/Cortex - Commissioning & Configuration UI for retail lighting. Setup, mapping, and rules platform (NOT a dashboard or analytics tool). Next.js 14 App Router, React, tRPC, Prisma, PostgreSQL, Tailwind. Multi-site aware with site-scoped data isolation.

**See [README.md](./README.md) for project overview and [ARCHITECTURE.md](./ARCHITECTURE.md) for system architecture.**

## Critical Rules

1. **Design tokens only** - Never hard-code colors/spacing. Use `var(--color-*)`, `var(--space-*)` from `app/globals.css`
2. **Type safety** - tRPC for API calls, Zod for validation, TypeScript strict mode
3. **Server Components default** - Only use `'use client'` when needed (interactivity, hooks, browser APIs)
4. **Plain language** - No jargon, simple UX
5. **Site-aware** - All data contexts use site-scoped localStorage keys: `fusion_[data]_site_{siteId}`

## Multi-Site Architecture

- **SiteContext**: Manages `activeSiteId`, `sites`, `setActiveSite`
- **Site-Scoped Keys**: `fusion_[data]_site_{siteId}` (devices, zones, rules, maps, BACnet)
- **Auto-Reload**: Contexts reload when `activeSiteId` changes
- **Site Switching**: Dropdown in `PageTitle` component

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

// 3. Create router (if needed)
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

### Making a Component Site-Aware

```typescript
import { useSite } from '@/lib/SiteContext'

export function MyComponent() {
  const { activeSiteId } = useSite()
  
  // Use site-scoped localStorage key
  const storageKey = `fusion_myData_site_${activeSiteId}`
  
  // Reload when site changes
  useEffect(() => {
    // Load data for activeSiteId
  }, [activeSiteId])
}
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

### Layout Pattern

```typescript
// Main content area pattern (used across all pages)
<div className="flex-1 flex min-h-0 gap-4 px-[20px] pb-14">
  {/* Left: Main content */}
  <div className="flex-1 min-w-0 flex flex-col">
    {/* Content here */}
  </div>
  
  {/* Right: Panel (always visible) */}
  <div className="flex-shrink-0">
    <SomePanel />
  </div>
</div>
```

## File Structure

- **Pages**: `app/(main)/[section]/page.tsx`
- **Layout**: `components/layout/` (MainNav, TopBar, ContextPanel, etc.)
- **Features**: `components/[feature]/` (map, zones, rules, lookup, etc.)
- **Contexts**: `lib/[Feature]Context.tsx` (DeviceContext, ZoneContext, RuleContext, SiteContext)
- **tRPC**: `server/trpc/routers/[feature].ts` → `server/trpc/routers/_app.ts`
- **Schema**: `prisma/schema.prisma`
- **Tokens**: `app/globals.css` (`:root` section)

## Design Tokens (Quick Reference)

See `app/globals.css` for full token list. Key tokens:
- **Colors**: `--color-primary`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-success`, `--color-danger`, `--color-warning`
- **Spacing**: `--space-1` through `--space-20` (4px base unit)
- **Radius**: `--radius-xs` through `--radius-2xl`
- **Shadows**: `--shadow-soft`, `--shadow-md`, `--shadow-strong`

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

**Site data not switching**
- Ensure using `activeSiteId` from `SiteContext`
- Check localStorage keys include site ID
- Verify context reloads when `activeSiteId` changes

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
- Device discovery/scanning (removed - use manual entry in lookup page)

## Quick Checklist

When adding features:
- ✅ Uses design tokens (no hard-coded values)
- ✅ Type-safe (tRPC + TypeScript)
- ✅ Server Component unless client features needed
- ✅ Added to navigation if main section
- ✅ tRPC router created and added to app router
- ✅ Database schema updated if needed
- ✅ Plain language, no jargon
- ✅ Site-aware if dealing with data
- ✅ Reloads when active site changes

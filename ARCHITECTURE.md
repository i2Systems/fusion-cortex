# Architecture Overview

> **AI Note**: This document describes the current system architecture. For AI-specific patterns, see [AI_NOTES.md](./AI_NOTES.md). For deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md).

**System architecture, data flow, and design patterns documentation.**

## 📋 Table of Contents

- [System Architecture](#system-architecture)
- [Data Flow](#data-flow)
- [Component Hierarchy](#component-hierarchy)
- [State Management](#state-management)
- [Design Token System](#design-token-system)
- [File Organization](#file-organization-principles)
- [Type Safety](#type-safety)
- [Performance](#performance-considerations)

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Pages  │  │Components│  │  Layout  │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │              │                    │
│       └─────────────┴──────────────┘                    │
│                    │                                     │
│                    ▼                                     │
│            ┌──────────────┐                             │
│            │  tRPC Client │                             │
│            └──────┬───────┘                             │
└───────────────────┼─────────────────────────────────────┘
                    │ HTTP/JSON
                    ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (Next.js API Routes)                │
│            ┌──────────────────────┐                      │
│            │  tRPC Server        │                      │
│            │  ┌──────────────┐   │                      │
│            │  │   Routers    │   │                      │
│            │  └──────┬───────┘   │                      │
│            └─────────┼───────────┘                      │
│                      │                                   │
│                      ▼                                   │
│            ┌──────────────────┐                         │
│            │  Prisma Client   │                         │
│            └────────┬─────────┘                         │
└─────────────────────┼────────────────────────────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │   PostgreSQL     │
            └──────────────────┘
```

## Data Flow

### Reading Data (Query)
1. React component calls `trpc.device.search.useQuery({ query: '765' })`
2. tRPC client sends HTTP request to `/api/trpc`
3. tRPC server routes to `deviceRouter.search`
4. Router procedure executes Prisma query
5. Results serialized with superjson (handles Dates, etc.)
6. Response sent back to client
7. React Query caches and updates component

### Writing Data (Mutation)
1. React component calls `trpc.zone.create.useMutation()`
2. Similar flow, but uses POST and updates database
3. React Query invalidates related queries
4. UI updates automatically

## Component Hierarchy

```
RootLayout (app/layout.tsx)
  └─ TRPCProvider
     └─ StateHydration (initializes Zustand stores from tRPC)
        └─ MainLayout (app/(main)/layout.tsx)
           ├─ MainNav (left, 80px)
           └─ Content Area
              ├─ PageTitle (top, site selector + breadcrumbs)
              ├─ Main Content (center, flexible)
              │  └─ Section Pages (dashboard, map, zones, lookup, etc.)
              ├─ ContextPanel (right, 384px, slide-in)
              └─ BottomDrawer (bottom, collapsible)
```

**Key Components:**
- `StateHydration` - Initializes Zustand stores from database (replaces Context Provider data fetching)
- `MainLayout` - Main app layout with navigation and panels
- `PageTitle` - Site selector and breadcrumbs
- `ContextPanel` - Right-side panel for details (resizable, collapsible)
- `BottomDrawer` - Status bar and notifications

## Design Token System

All design values flow from `app/globals.css`:

```
:root {
  --color-primary: #4c7dff;
  --space-4: 1rem;
  --radius-lg: 12px;
  ...
}
         │
         ▼
Components use tokens:
  background: var(--color-primary);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
```

**Benefits:**
- Single source of truth
- Easy theming (change tokens, entire app updates)
- No hard-coded values
- Consistent design system

## File Organization Principles

1. **Routes**: One route per feature section in `app/(main)/[section]/`
2. **Components**: Reusable components in `components/`, organized by feature
3. **API**: tRPC routers in `server/trpc/routers/`, one router per domain
4. **Database**: Prisma schema in `prisma/schema.prisma`
5. **Styles**: Global tokens in `app/globals.css`, component styles inline or in components

## State Management

**Current Architecture (2025):**

- **Client State**: Zustand stores (`lib/stores/*Store.ts`) - Global application state
  - `deviceStore`, `zoneStore`, `ruleStore`, `siteStore`, `mapStore`
  - Selective subscriptions (components only re-render for data they use)
  - Built-in undo/redo via immer middleware
- **Server State**: React Query (via tRPC) - handles API data, caching, refetching
- **Sync Layer**: `use*Sync` hooks (`lib/stores/use*Sync.ts`) - Bridge tRPC ↔ Zustand stores
- **Data Hooks**: `use*()` hooks (`lib/hooks/use*.ts`) - React hooks that use stores
- **UI State**: React useState/useReducer - local component state
- **Legacy**: Context API files exist for backward compatibility but are deprecated

**Data Flow:**
```
tRPC Query → use*Sync hook → Zustand Store → use*() hook → Component
```

**Example:**
```typescript
// Component uses data hook
const { devices } = useDevices()

// Hook uses store
export function useDevices() {
  const devices = useDeviceStore(state => state.devices)
  // ... sync logic
  return { devices }
}

// Store is hydrated by sync hook
useDeviceSync() // Runs in StateHydration component
```

## Type Safety

- **Frontend ↔ Backend**: tRPC provides end-to-end type safety
- **Database ↔ Backend**: Prisma generates TypeScript types from schema
- **Forms/Validation**: Zod schemas in tRPC procedures

## Performance Considerations

- **Server Components**: Default in Next.js App Router (no JS sent to client)
- **Client Components**: Only when needed (`'use client'`)
- **Code Splitting**: Automatic via Next.js route-based splitting
- **Caching**: React Query handles API response caching
- **Database**: Prisma connection pooling (configure in DATABASE_URL)
- **State Management**: Zustand stores provide selective subscriptions (components only re-render for data they use)

## Related Documentation

- [README.md](./README.md) - Project overview and features
- [AI_NOTES.md](./AI_NOTES.md) - AI-specific patterns and examples
- [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) - Complete documentation navigation

## Security

- **Authentication**: Auth.js (NextAuth) - to be configured
- **Authorization**: tRPC middleware - to be implemented
- **Input Validation**: Zod schemas in all tRPC procedures
- **SQL Injection**: Prevented by Prisma (parameterized queries)

## Scalability

- **Horizontal Scaling**: Stateless API routes, shared database
- **Background Tasks**: Node workers + Redis queue (future)
- **Caching**: Redis for frequently accessed data (future)
- **Database**: PostgreSQL handles large datasets efficiently

## Development Workflow

1. **Add Feature**: Create route → Add nav → Create router → Update schema
2. **Modify Design**: Update tokens in `app/styles/themes/*.css`
3. **Add API**: Create procedure in router → Use sync hook → Update store
4. **Database Changes**: Update schema → Generate client → Push/migrate

## Migration Notes

**⚠️ Important**: The codebase has migrated from React Context API to Zustand stores:

- **Old Pattern** (Deprecated): `DeviceContext`, `ZoneContext`, etc.
- **New Pattern** (Current): Zustand stores + sync hooks + data hooks
- **Compatibility**: Legacy Context files exist but are pass-through wrappers
- **When to Use**: Always use the new pattern (`useDevices()`, `useZones()`, etc. from `lib/hooks/`)

See [AI_NOTES.md](./AI_NOTES.md) for detailed migration patterns.


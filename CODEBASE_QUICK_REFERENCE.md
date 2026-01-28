# Codebase Quick Reference

> **AI Note**: Quick reference for common file locations and patterns. See [AI_NOTES.md](./AI_NOTES.md) for detailed patterns.

## 🗂️ Key File Locations

### Entry Points
- **Root Layout**: `app/layout.tsx` - Sets up all providers
- **Main Layout**: `app/(main)/layout.tsx` - Main app structure
- **State Hydration**: `components/StateHydration.tsx` - Initializes Zustand stores

### State Management (Current)
- **Stores**: `lib/stores/*Store.ts` - Zustand stores
- **Sync Hooks**: `lib/stores/use*Sync.ts` - tRPC ↔ store bridges
- **Data Hooks**: `lib/hooks/use*.ts` - React hooks using stores

### Pages
- **Dashboard**: `app/(main)/dashboard/page.tsx`
- **Map**: `app/(main)/map/page.tsx`
- **Zones**: `app/(main)/zones/page.tsx`
- **Rules**: `app/(main)/rules/page.tsx`
- **Lookup**: `app/(main)/lookup/page.tsx`
- **Faults**: `app/(main)/faults/page.tsx`
- **BACnet**: `app/(main)/bacnet/page.tsx`
- **Firmware**: `app/(main)/firmware/page.tsx`

### Components
- **Layout**: `components/layout/` - MainNav, PageTitle, ContextPanel, BottomDrawer
- **Features**: `components/[feature]/` - Feature-specific components
- **Shared**: `components/shared/` - Reusable components
- **UI**: `components/ui/` - Base UI components (Button, Input, etc.)

### API
- **tRPC Routers**: `server/trpc/routers/[feature].ts`
- **App Router**: `server/trpc/routers/_app.ts`
- **tRPC Client**: `lib/trpc/client.ts`

### Database
- **Schema**: `prisma/schema.prisma`
- **Migrations**: `prisma/migrations/`

### Styles
- **Global**: `app/globals.css` - Entry point, imports all themes
- **Themes**: `app/styles/themes/*.css` - Individual theme files
- **Base**: `app/styles/base.css` - Core variable definitions
- **Components**: `app/styles/components.css` - Component overrides

## 🔑 Common Patterns

### Using State (Current Pattern)
```typescript
// ✅ Preferred: Use data hook
import { useDevices } from '@/lib/hooks/useDevices'
const { devices, isLoading } = useDevices()

// ✅ Alternative: Direct store access (selective subscription)
import { useDeviceStore } from '@/lib/stores/deviceStore'
const devices = useDeviceStore(state => state.devices)
```

### Site-Aware Data
```typescript
import { useSite } from '@/lib/hooks/useSite'
const { activeSiteId } = useSite()
const storageKey = `fusion_myData_site_${activeSiteId}`
```

### tRPC Usage
```typescript
import { trpc } from '@/lib/trpc/client'
const { data } = trpc.device.list.useQuery()
const mutation = trpc.device.create.useMutation()
```

### Error Handling
```typescript
import { useErrorHandler } from '@/lib/hooks/useErrorHandler'
const { handleError } = useErrorHandler()
try {
  await save()
} catch (error) {
  handleError(error, { title: 'Failed to save' })
}
```

## ⚠️ Deprecated Patterns

**DO NOT USE:**
- `DeviceContext`, `ZoneContext`, `RuleContext`, `SiteContext` - Use Zustand stores
- `useDomain()` - Use `useDevices()`, `useZones()`, `useRules()` directly
- `MapContext` - Use `useMap()` hook or `mapStore` directly

**Migration:**
- Old: `const { devices } = useDevices()` from Context
- New: `const { devices } = useDevices()` from `lib/hooks/useDevices.ts` (same API)

## 📚 Documentation

- **Main**: [README.md](./README.md)
- **AI Reference**: [AI_NOTES.md](./AI_NOTES.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **All Docs**: [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

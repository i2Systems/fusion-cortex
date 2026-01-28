/**
 * Site Context (Compatibility Re-exports)
 * 
 * This file maintains backward compatibility by re-exporting the actual
 * implementation from lib/hooks/useSite.ts. All existing imports continue to work.
 * 
 * @deprecated New code should import directly from:
 *   - `useSite` from '@/lib/hooks/useSite'
 *   - `Site` type from '@/lib/stores/siteStore'
 */

'use client'

import { ReactNode } from 'react'

// Re-export actual implementation (maintains API compatibility)
export { useSite } from '@/lib/hooks/useSite'
export type { Site } from '@/lib/stores/siteStore'

/**
 * SiteProvider
 * 
 * @deprecated No longer needed - StateHydration handles initialization.
 * Kept as pass-through for backward compatibility.
 */
export function SiteProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}


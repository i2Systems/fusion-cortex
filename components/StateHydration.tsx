'use client'

import { FC, ReactNode } from 'react'
import { useSiteSync } from '@/lib/stores/useSiteSync'
import { useMapSync } from '@/lib/stores/useMapSync'
import { useDeviceSync } from '@/lib/stores/useDeviceSync'
import { useZoneSync } from '@/lib/stores/useZoneSync'
import { useRuleSync } from '@/lib/stores/useRuleSync'

/**
 * StateHydration
 * 
 * Invokes all "Sync" hooks to hydrate Zustand stores from the server (tRPC).
 * This replaces top-level Context Providers that were doing data fetching.
 * 
 * Must be placed inside TRPCProvider.
 */
export const StateHydration: FC<{ children: ReactNode }> = ({ children }) => {
    // Sync logic for all stores from server (tRPC)
    useSiteSync()
    useMapSync()
    useDeviceSync()
    useZoneSync()
    useRuleSync()

    return <>{children}</>
}

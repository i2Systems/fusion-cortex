'use client'

import { ReactNode } from 'react'

// Re-export new hooks for backward compatibility
export { useDevices } from '@/lib/hooks/useDevices'
export { useZones } from '@/lib/hooks/useZones'
export { useRules } from '@/lib/hooks/useRules'

// Re-export types
export { useDeviceStore, useDevicesLoading, useDevicesError } from '@/lib/stores/deviceStore'
export { useZoneStore, pointInPolygon, type Zone } from '@/lib/stores/zoneStore'
export { useRuleStore, useRulesLoading } from '@/lib/stores/ruleStore'
export type { Rule, RuleType, TargetType, TriggerType, ScheduleFrequency } from '@/lib/mockRules'

/**
 * DomainProvider
 * 
 * @deprecated logic moved to StateHydration.
 */
export function DomainProvider({ children }: { children: ReactNode }) {
    return <>{children}</>
}

/**
 * useDomain
 * 
 * @deprecated Use useDevices(), useZones(), useRules() directly.
 */
export function useDomain() {
    throw new Error('useDomain is deprecated. Import useDevices, useZones, or useRules directly.')
}

'use client'

import { ReactNode, createContext, useContext } from 'react'

// Import sync hooks that bridge tRPC with Zustand stores
import { useDeviceSync } from '@/lib/stores/useDeviceSync'
import { useZoneSync } from '@/lib/stores/useZoneSync'
import { useRuleSync } from '@/lib/stores/useRuleSync'

// Re-export Zustand stores for direct state access
export { useDeviceStore, useDevicesLoading, useDevicesError } from '@/lib/stores/deviceStore'
export { useZoneStore, pointInPolygon, type Zone } from '@/lib/stores/zoneStore'
export { useRuleStore, useRulesLoading } from '@/lib/stores/ruleStore'

// Re-export types for compatibility
export type { Rule, RuleType, TargetType, TriggerType, ScheduleFrequency } from '@/lib/mockRules'

/**
 * DomainContext
 * 
 * Provides mutation functions for devices, zones, and rules.
 * State is accessed directly via Zustand stores (useDevices, useZones, useRules).
 * 
 * This context only exposes ACTION functions (add, update, delete).
 * DATA is accessed via the exported Zustand selectors.
 */

interface DomainContextType {
    // Device mutations
    addDevice: ReturnType<typeof useDeviceSync>['addDevice']
    updateDevice: ReturnType<typeof useDeviceSync>['updateDevice']
    updateDevicePosition: ReturnType<typeof useDeviceSync>['updateDevicePosition']
    updateMultipleDevices: ReturnType<typeof useDeviceSync>['updateMultipleDevices']
    removeDevice: ReturnType<typeof useDeviceSync>['removeDevice']
    removeMultipleDevices: ReturnType<typeof useDeviceSync>['removeMultipleDevices']
    refreshDevices: ReturnType<typeof useDeviceSync>['refreshDevices']
    undo: ReturnType<typeof useDeviceSync>['undo']
    redo: ReturnType<typeof useDeviceSync>['redo']
    canUndo: boolean
    canRedo: boolean

    // Zone mutations
    addZone: ReturnType<typeof useZoneSync>['addZone']
    updateZone: ReturnType<typeof useZoneSync>['updateZone']
    deleteZone: ReturnType<typeof useZoneSync>['deleteZone']
    getDevicesInZone: ReturnType<typeof useZoneSync>['getDevicesInZone']
    getZoneForDevice: ReturnType<typeof useZoneSync>['getZoneForDevice']
    syncZoneDeviceIds: ReturnType<typeof useZoneSync>['syncZoneDeviceIds']
    saveZones: ReturnType<typeof useZoneSync>['saveZones']
    isZonesSaved: ReturnType<typeof useZoneSync>['isZonesSaved']

    // Rule mutations
    addRule: ReturnType<typeof useRuleSync>['addRule']
    updateRule: ReturnType<typeof useRuleSync>['updateRule']
    deleteRule: ReturnType<typeof useRuleSync>['deleteRule']
    toggleRule: ReturnType<typeof useRuleSync>['toggleRule']
    refreshRules: ReturnType<typeof useRuleSync>['refreshRules']
}

const DomainContext = createContext<DomainContextType | undefined>(undefined)

/**
 * DomainProvider
 * 
 * Initializes Zustand store hydration via sync hooks.
 * Place this inside the tRPC and Site providers.
 */
export function DomainProvider({ children }: { children: ReactNode }) {
    // Initialize sync hooks - these hydrate the Zustand stores
    const deviceSync = useDeviceSync()
    const zoneSync = useZoneSync()
    const ruleSync = useRuleSync()

    return (
        <DomainContext.Provider
            value={{
                // Devices
                addDevice: deviceSync.addDevice,
                updateDevice: deviceSync.updateDevice,
                updateDevicePosition: deviceSync.updateDevicePosition,
                updateMultipleDevices: deviceSync.updateMultipleDevices,
                removeDevice: deviceSync.removeDevice,
                removeMultipleDevices: deviceSync.removeMultipleDevices,
                refreshDevices: deviceSync.refreshDevices,
                undo: deviceSync.undo,
                redo: deviceSync.redo,
                canUndo: deviceSync.canUndo,
                canRedo: deviceSync.canRedo,

                // Zones
                addZone: zoneSync.addZone,
                updateZone: zoneSync.updateZone,
                deleteZone: zoneSync.deleteZone,
                getDevicesInZone: zoneSync.getDevicesInZone,
                getZoneForDevice: zoneSync.getZoneForDevice,
                syncZoneDeviceIds: zoneSync.syncZoneDeviceIds,
                saveZones: zoneSync.saveZones,
                isZonesSaved: zoneSync.isZonesSaved,

                // Rules
                addRule: ruleSync.addRule,
                updateRule: ruleSync.updateRule,
                deleteRule: ruleSync.deleteRule,
                toggleRule: ruleSync.toggleRule,
                refreshRules: ruleSync.refreshRules,
            }}
        >
            {children}
        </DomainContext.Provider>
    )
}

/**
 * useDomain - Access action functions
 * 
 * For data access, use useDevices(), useZones(), or useRules() directly.
 */
export function useDomain() {
    const context = useContext(DomainContext)
    if (context === undefined) {
        throw new Error('useDomain must be used within a DomainProvider')
    }
    return context
}

// Legacy compatibility hooks
// These wrap the new Zustand-based system to maintain the existing API

import { useDeviceStore } from '@/lib/stores/deviceStore'
import { useZoneStore } from '@/lib/stores/zoneStore'
import { useRuleStore } from '@/lib/stores/ruleStore'

export function useDevices() {
    const domain = useDomain()
    const devices = useDeviceStore((s) => s.devices)
    const isLoading = useDeviceStore((s) => s.isLoading)
    const error = useDeviceStore((s) => s.error)

    return {
        devices,
        isLoading,
        error,
        addDevice: domain.addDevice,
        updateDevice: domain.updateDevice,
        updateDevicePosition: domain.updateDevicePosition,
        updateMultipleDevices: domain.updateMultipleDevices,
        removeDevice: domain.removeDevice,
        removeMultipleDevices: domain.removeMultipleDevices,
        setDevices: useDeviceStore.getState().setDevices,
        refreshDevices: domain.refreshDevices,
        saveDevices: () => { },
        undo: domain.undo,
        redo: domain.redo,
        canUndo: domain.canUndo,
        canRedo: domain.canRedo,
    }
}

export function useZones() {
    const domain = useDomain()
    const zones = useZoneStore((s) => s.zones)

    return {
        zones,
        addZone: domain.addZone,
        updateZone: domain.updateZone,
        deleteZone: domain.deleteZone,
        getDevicesInZone: domain.getDevicesInZone,
        getZoneForDevice: domain.getZoneForDevice,
        syncZoneDeviceIds: domain.syncZoneDeviceIds,
        saveZones: domain.saveZones,
        isZonesSaved: domain.isZonesSaved,
    }
}

export function useRules() {
    const domain = useDomain()
    const rules = useRuleStore((s) => s.rules)
    const isLoading = useRuleStore((s) => s.isLoading)

    return {
        rules,
        isLoading,
        addRule: domain.addRule,
        updateRule: domain.updateRule,
        deleteRule: domain.deleteRule,
        toggleRule: domain.toggleRule,
        refreshRules: domain.refreshRules,
    }
}

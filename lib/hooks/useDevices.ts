/**
 * useDevices Hook
 * 
 * Consumer hook for Device state and actions.
 * Replaces DomainContext.useDevices
 */

'use client'

import { useDeviceStore } from '@/lib/stores/deviceStore'
import { useDeviceActions } from '@/lib/hooks/useDeviceActions'

export function useDevices() {
    const store = useDeviceStore()
    const actions = useDeviceActions()

    return {
        devices: store.devices,
        isLoading: store.isLoading,
        error: store.error,

        // Actions
        addDevice: actions.addDevice,
        updateDevice: actions.updateDevice,
        updateDevicePosition: actions.updateDevicePosition,
        updateMultipleDevices: actions.updateMultipleDevices,
        removeDevice: actions.removeDevice,
        removeMultipleDevices: actions.removeMultipleDevices,
        refreshDevices: actions.refreshDevices,

        // Undo/Redo
        undo: actions.undo,
        redo: actions.redo,
        canUndo: actions.canUndo,
        canRedo: actions.canRedo,

        // Helper to set devices directly (rarely used outside of sync)
        setDevices: store.setDevices,
        saveDevices: () => { }, // No-op for compatibility
    }
}

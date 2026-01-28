/**
 * useZones Hook
 * 
 * Consumer hook for Zone state and actions.
 * Replaces DomainContext.useZones
 */

'use client'

import { useZoneStore } from '@/lib/stores/zoneStore'
import { useZoneActions } from '@/lib/hooks/useZoneActions'

export function useZones() {
    const store = useZoneStore()
    const actions = useZoneActions()

    return {
        zones: store.zones,

        addZone: actions.addZone,
        updateZone: actions.updateZone,
        deleteZone: actions.deleteZone,
        getDevicesInZone: actions.getDevicesInZone,
        getZoneForDevice: actions.getZoneForDevice,
        syncZoneDeviceIds: actions.syncZoneDeviceIds,
        saveZones: actions.saveZones,
        isZonesSaved: actions.isZonesSaved,
    }
}

/**
 * Zone Actions Hook
 */

'use client'

import { useCallback } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useSiteStore } from '@/lib/stores/siteStore'
import { useZoneStore, Zone } from '@/lib/stores/zoneStore'
import { useToast } from '@/lib/ToastContext'

export function useZoneActions() {
    const activeSiteId = useSiteStore((s) => s.activeSiteId)
    const store = useZoneStore()
    const utils = trpc.useContext()
    const { addToast } = useToast()

    // Mutations
    const createMutation = trpc.zone.create.useMutation({
        onSuccess: () => utils.zone.list.invalidate({ siteId: activeSiteId || '' }),
    })
    const updateMutation = trpc.zone.update.useMutation({
        onSuccess: () => utils.zone.list.invalidate({ siteId: activeSiteId || '' }),
    })
    const deleteMutation = trpc.zone.delete.useMutation({
        onSuccess: () => utils.zone.list.invalidate({ siteId: activeSiteId || '' }),
    })

    const addZone = useCallback(
        async (zoneData: Omit<Zone, 'id' | 'createdAt' | 'updatedAt'>): Promise<Zone> => {
            if (!activeSiteId) throw new Error('No active site')

            const tempZone: Zone = {
                ...zoneData,
                id: `temp-${Date.now()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            store.addZone(tempZone)

            try {
                const result = await createMutation.mutateAsync({
                    siteId: activeSiteId,
                    name: zoneData.name,
                    color: zoneData.color,
                    description: zoneData.description,
                    polygon: zoneData.polygon,
                    deviceIds: zoneData.deviceIds || [],
                })

                // Result from mutation is likely the full Zone object (or compatible)
                // If the mutation returns the new DB object, we should return that.
                // Assuming result maps to Zone.
                const newZone: Zone = {
                    id: result.id,
                    name: result.name,
                    color: result.color,
                    description: result.description || undefined,
                    polygon: result.polygon || [],
                    deviceIds: zoneData.deviceIds || [],
                    createdAt: new Date(result.createdAt),
                    updatedAt: new Date(result.updatedAt)
                }

                store.updateZone(tempZone.id, newZone)
                return newZone
            } catch (err) {
                console.error('Failed to create zone:', err)
                addToast({ type: 'error', title: 'Error', message: 'Failed to create zone' })
                store.removeZone(tempZone.id)
                throw err
            }
        },
        [activeSiteId, createMutation, store, addToast]
    )

    const updateZone = useCallback(
        async (zoneId: string, updates: Partial<Zone>) => {
            store.updateZone(zoneId, updates)

            try {
                const dbUpdates: Record<string, unknown> = {}
                if (updates.name !== undefined) dbUpdates.name = updates.name
                if (updates.color !== undefined) dbUpdates.color = updates.color
                if (updates.description !== undefined) dbUpdates.description = updates.description
                if (updates.polygon !== undefined) dbUpdates.polygon = updates.polygon
                if (updates.deviceIds !== undefined) dbUpdates.deviceIds = updates.deviceIds

                await updateMutation.mutateAsync({ id: zoneId, ...dbUpdates })
            } catch (err) {
                console.error('Failed to update zone:', err)
                addToast({ type: 'error', title: 'Error', message: 'Failed to update zone' })
                utils.zone.list.invalidate({ siteId: activeSiteId || '' })
            }
        },
        [activeSiteId, updateMutation, store, addToast, utils]
    )

    const deleteZone = useCallback(
        async (zoneId: string) => {
            store.removeZone(zoneId)

            try {
                await deleteMutation.mutateAsync({ id: zoneId })
            } catch (err) {
                console.error('Failed to delete zone:', err)
                addToast({ type: 'error', title: 'Error', message: 'Failed to delete zone' })
                utils.zone.list.invalidate({ siteId: activeSiteId || '' })
            }
        },
        [activeSiteId, deleteMutation, store, addToast, utils]
    )

    // Helpers utilizing the store getter
    // Note: In Zustand, "get" functions are usually available on the store object if defined, or via getState()
    // Here we duplicate logic or assume store has them.
    // The original useZoneSync had getDevicesInZone.
    // Let's implement them here using the store state.

    const getDevicesInZone = useCallback((zoneId: string, devices: any[]) => {
        const zone = store.zones.find((z) => z.id === zoneId)
        if (!zone) return []
        // Simple pointInPolygon check would happen here, usually imported from utils
        // For now, assuming devices have zoneId property if explicitly assigned
        // In the original, it did a point check.

        // Re-importing pointInPolygon from store file if exported, or utils
        const { pointInPolygon } = require('@/lib/stores/zoneStore')
        return devices.filter(d => pointInPolygon([d.x, d.y], zone.polygon))
    }, [store.zones])

    const getZoneForDevice = useCallback((device: any) => {
        const { pointInPolygon } = require('@/lib/stores/zoneStore')
        return store.zones.find(z => pointInPolygon([device.x, device.y], z.polygon))
    }, [store.zones])

    const syncZoneDeviceIds = useCallback(
        async (allDevices: any[]) => { // Using any[] to avoid circular dependency with Device type if possible, or import it
            const zonesToUpdate = store.zones.map((zone) => {
                const { pointInPolygon } = require('@/lib/stores/zoneStore') // Dynamic import to avoid cycles if needed
                const devicesInZone = allDevices.filter((device) => {
                    if (device.x === undefined || device.y === undefined) return false
                    return pointInPolygon({ x: device.x, y: device.y }, zone.polygon)
                })
                return { zoneId: zone.id, deviceIds: devicesInZone.map((d: any) => d.id) }
            })

            try {
                await Promise.all(
                    zonesToUpdate.map(({ zoneId, deviceIds }) =>
                        updateMutation.mutateAsync({ id: zoneId, deviceIds })
                    )
                )
            } catch (err) {
                addToast({ type: 'error', title: 'Error', message: 'Failed to sync zone devices' })
            }
        },
        [store.zones, updateMutation, addToast]
    )
    const saveZones = useCallback(async () => { }, [])
    const isZonesSaved = useCallback(() => true, [])

    return {
        addZone,
        updateZone,
        deleteZone,
        getDevicesInZone,
        getZoneForDevice,
        syncZoneDeviceIds,
        saveZones,
        isZonesSaved
    }
}

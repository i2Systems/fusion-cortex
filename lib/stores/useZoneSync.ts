/**
 * Zone Sync Hook
 * 
 * Bridges tRPC data fetching with the Zustand zone store.
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useSite } from '@/lib/SiteContext'
import { useErrorHandler } from '@/lib/hooks/useErrorHandler'
import { useZoneStore, type Zone, pointInPolygon } from '@/lib/stores/zoneStore'
import type { Device } from '@/lib/mockData'

export function useZoneSync() {
    const { activeSiteId, activeSite } = useSite()
    const { handleError } = useErrorHandler()
    const store = useZoneStore()
    const utils = trpc.useContext()

    const ensuredSiteIdRef = useRef<string | null>(null)

    // Ensure site exists mutation
    const ensureSiteMutation = trpc.site.ensureExists.useMutation()

    // Fetch zones from database
    const { data: zonesData, refetch } = trpc.zone.list.useQuery(
        { siteId: activeSiteId || '' },
        {
            enabled: !!activeSiteId,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
        }
    )

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

    // Ensure site exists
    useEffect(() => {
        if (!activeSiteId) return
        if (ensuredSiteIdRef.current === activeSiteId) return

        ensuredSiteIdRef.current = activeSiteId
        const siteName = activeSite?.name || `Site ${activeSiteId}`
        const siteNumber = activeSite?.siteNumber || activeSiteId.replace('site-', '')

        ensureSiteMutation.mutate({
            id: activeSiteId,
            name: siteName,
            storeNumber: siteNumber,
        })
    }, [activeSiteId, activeSite])

    // Hydrate store from server data
    useEffect(() => {
        if (zonesData && Array.isArray(zonesData)) {
            const transformed: Zone[] = zonesData.map((zone) => ({
                id: zone.id,
                name: zone.name,
                color: zone.color,
                description: zone.description || undefined,
                polygon: zone.polygon || [],
                deviceIds: zone.deviceIds || [],
                createdAt: new Date(zone.createdAt),
                updatedAt: new Date(zone.updatedAt),
            }))
            store.setZones(transformed)
        }
    }, [zonesData])

    // Mutation wrappers
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

                const newZone: Zone = {
                    id: result.id,
                    name: result.name,
                    color: result.color,
                    description: result.description || undefined,
                    polygon: result.polygon || [],
                    deviceIds: zoneData.deviceIds || [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }

                store.updateZone(tempZone.id, { ...newZone })
                return newZone
            } catch (err) {
                handleError(err, { title: 'Failed to create zone' })
                store.removeZone(tempZone.id)
                throw err
            }
        },
        [activeSiteId, createMutation, handleError]
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
                handleError(err, { title: 'Failed to update zone' })
                utils.zone.list.invalidate({ siteId: activeSiteId || '' })
            }
        },
        [updateMutation, utils, activeSiteId, handleError]
    )

    const deleteZone = useCallback(
        async (zoneId: string) => {
            store.removeZone(zoneId)

            try {
                await deleteMutation.mutateAsync({ id: zoneId })
            } catch (err) {
                handleError(err, { title: 'Failed to delete zone' })
                utils.zone.list.invalidate({ siteId: activeSiteId || '' })
            }
        },
        [deleteMutation, utils, activeSiteId, handleError]
    )

    const getDevicesInZone = useCallback(
        (zoneId: string, allDevices: Device[]): Device[] => {
            const zone = store.zones.find((z) => z.id === zoneId)
            if (!zone) return []

            return allDevices.filter((device) => {
                if (device.x === undefined || device.y === undefined) return false
                return pointInPolygon({ x: device.x, y: device.y }, zone.polygon)
            })
        },
        [store.zones]
    )

    const getZoneForDevice = useCallback(
        (deviceId: string): Zone | null => {
            for (const zone of store.zones) {
                if (zone.deviceIds.includes(deviceId)) {
                    return zone
                }
            }
            return null
        },
        [store.zones]
    )

    const syncZoneDeviceIds = useCallback(
        async (allDevices: Device[]) => {
            const zonesToUpdate = store.zones.map((zone) => {
                const devicesInZone = allDevices.filter((device) => {
                    if (device.x === undefined || device.y === undefined) return false
                    return pointInPolygon({ x: device.x, y: device.y }, zone.polygon)
                })
                return { zoneId: zone.id, deviceIds: devicesInZone.map((d) => d.id) }
            })

            try {
                await Promise.all(
                    zonesToUpdate.map(({ zoneId, deviceIds }) =>
                        updateMutation.mutateAsync({ id: zoneId, deviceIds })
                    )
                )
            } catch (err) {
                handleError(err, { title: 'Failed to sync zone devices' })
            }
        },
        [store.zones, updateMutation, handleError]
    )

    return {
        addZone,
        updateZone,
        deleteZone,
        getDevicesInZone,
        getZoneForDevice,
        syncZoneDeviceIds,
        saveZones: async () => { },
        isZonesSaved: () => true,
    }
}

/**
 * Device Sync Hook
 * 
 * Bridges tRPC data fetching with the Zustand device store.
 * Handles server data hydration and exposes mutation functions.
 * 
 * Usage: Call useDeviceSync() once in a parent component (e.g., DomainProvider).
 * Then use useDeviceStore() or useDevices() anywhere for state access.
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useSite } from '@/lib/SiteContext'
import { useErrorHandler } from '@/lib/hooks/useErrorHandler'
import { useDeviceStore } from '@/lib/stores/deviceStore'
import type { Device } from '@/lib/mockData'

export function useDeviceSync() {
    const { activeSiteId, activeSite } = useSite()
    const { handleError } = useErrorHandler()
    const store = useDeviceStore()
    const utils = trpc.useContext()

    // Debounce timer for position updates
    const positionUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const ensuredSiteIdRef = useRef<string | null>(null)
    const previousSiteIdRef = useRef<string | null>(null)

    // Ensure site exists mutation
    const ensureSiteMutation = trpc.site.ensureExists.useMutation()

    // Fetch devices from database
    const { data: devicesData, refetch, isLoading, error } = trpc.device.list.useQuery(
        { siteId: activeSiteId || '', includeComponents: true },
        {
            enabled: !!activeSiteId,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 2,
            retryDelay: 1000,
        }
    )

    // Mutations
    const createMutation = trpc.device.create.useMutation({
        onSuccess: () => utils.device.list.invalidate({ siteId: activeSiteId || '' }),
    })
    const updateMutation = trpc.device.update.useMutation({
        onSuccess: (updated) => {
            utils.device.list.setData(
                { siteId: activeSiteId || '', includeComponents: true },
                (old) => old?.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
            )
        },
    })
    const deleteMutation = trpc.device.delete.useMutation({
        onSuccess: () => utils.device.list.invalidate({ siteId: activeSiteId || '' }),
    })
    const deleteManyMutation = trpc.device.deleteMany.useMutation({
        onSuccess: () => utils.device.list.invalidate({ siteId: activeSiteId || '' }),
    })

    // Sync loading/error state to store
    useEffect(() => {
        store.setLoading(isLoading)
    }, [isLoading])

    useEffect(() => {
        if (error) {
            store.setError(error)
            handleError(error, { title: 'Failed to load devices' })
        }
    }, [error])

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
            address: activeSite?.address,
            city: activeSite?.city,
            state: activeSite?.state,
            zipCode: activeSite?.zipCode,
            phone: activeSite?.phone,
            manager: activeSite?.manager,
            squareFootage: activeSite?.squareFootage,
            openedDate: activeSite?.openedDate,
        })
    }, [activeSiteId, activeSite])

    // Clear devices on site change
    useEffect(() => {
        if (activeSiteId !== previousSiteIdRef.current && previousSiteIdRef.current !== null) {
            store.setDevices([])
        }
        previousSiteIdRef.current = activeSiteId
    }, [activeSiteId])

    // Hydrate store from server data
    useEffect(() => {
        if (devicesData !== undefined) {
            store.setDevices(devicesData)
        }
    }, [devicesData])

    // Mutation wrappers that sync store + database
    const addDevice = useCallback(
        async (device: Device) => {
            if (!activeSiteId || !device.type) return

            store.addDevice(device)

            try {
                await createMutation.mutateAsync({
                    siteId: activeSiteId,
                    deviceId: device.deviceId,
                    serialNumber: device.serialNumber,
                    type: device.type,
                    status: device.status,
                    signal: device.signal,
                    battery: device.battery,
                    x: device.x,
                    y: device.y,
                    orientation: device.orientation,
                    warrantyStatus: device.warrantyStatus,
                    warrantyExpiry: device.warrantyExpiry,
                    components: device.components?.map((c) => ({
                        componentType: c.componentType,
                        componentSerialNumber: c.componentSerialNumber,
                        warrantyStatus: c.warrantyStatus,
                        warrantyExpiry: c.warrantyExpiry,
                        buildDate: c.buildDate,
                    })),
                })
            } catch (err) {
                handleError(err, { title: 'Failed to add device' })
                store.removeDevice(device.id)
            }
        },
        [activeSiteId, createMutation, handleError]
    )

    const updateDevice = useCallback(
        async (deviceId: string, updates: Partial<Device>) => {
            store.updateDevice(deviceId, updates)

            try {
                const dbUpdates: Record<string, unknown> = {}
                if (updates.deviceId !== undefined) dbUpdates.deviceId = updates.deviceId
                if (updates.serialNumber !== undefined) dbUpdates.serialNumber = updates.serialNumber
                if (updates.type !== undefined) dbUpdates.type = updates.type
                if (updates.status !== undefined) dbUpdates.status = updates.status
                if (updates.signal !== undefined) dbUpdates.signal = updates.signal
                if (updates.battery !== undefined) dbUpdates.battery = updates.battery
                if (updates.x !== undefined) dbUpdates.x = updates.x
                if (updates.y !== undefined) dbUpdates.y = updates.y
                if (updates.orientation !== undefined) dbUpdates.orientation = updates.orientation
                if (updates.warrantyStatus !== undefined) dbUpdates.warrantyStatus = updates.warrantyStatus
                if (updates.warrantyExpiry !== undefined) dbUpdates.warrantyExpiry = updates.warrantyExpiry

                await updateMutation.mutateAsync({ id: deviceId, ...dbUpdates })
            } catch (err) {
                handleError(err, { title: 'Failed to update device' })
                utils.device.list.invalidate({ siteId: activeSiteId || '' })
            }
        },
        [updateMutation, utils, activeSiteId, handleError]
    )

    const updateDevicePosition = useCallback(
        (deviceId: string, x: number, y: number) => {
            store.updateDevicePosition(deviceId, x, y)

            if (positionUpdateTimeoutRef.current) {
                clearTimeout(positionUpdateTimeoutRef.current)
            }

            positionUpdateTimeoutRef.current = setTimeout(async () => {
                try {
                    await updateMutation.mutateAsync({ id: deviceId, x, y })
                } catch (err) {
                    handleError(err, { title: 'Failed to save position' })
                    utils.device.list.invalidate({ siteId: activeSiteId || '' })
                }
            }, 1000)
        },
        [updateMutation, utils, activeSiteId, handleError]
    )

    const updateMultipleDevices = useCallback(
        async (updates: Array<{ deviceId: string; updates: Partial<Device> }>) => {
            store.updateMultipleDevices(updates)

            try {
                await Promise.all(
                    updates.map(({ deviceId, updates: deviceUpdates }) => {
                        const dbUpdates: Record<string, unknown> = {}
                        if (deviceUpdates.x !== undefined) dbUpdates.x = deviceUpdates.x
                        if (deviceUpdates.y !== undefined) dbUpdates.y = deviceUpdates.y
                        if (deviceUpdates.orientation !== undefined) dbUpdates.orientation = deviceUpdates.orientation
                        if (deviceUpdates.status !== undefined) dbUpdates.status = deviceUpdates.status
                        if (deviceUpdates.signal !== undefined) dbUpdates.signal = deviceUpdates.signal
                        if (deviceUpdates.battery !== undefined) dbUpdates.battery = deviceUpdates.battery
                        return updateMutation.mutateAsync({ id: deviceId, ...dbUpdates })
                    })
                )
            } catch (err) {
                handleError(err, { title: 'Failed to update devices' })
                utils.device.list.invalidate({ siteId: activeSiteId || '' })
            }
        },
        [updateMutation, utils, activeSiteId, handleError]
    )

    const removeDevice = useCallback(
        async (deviceId: string) => {
            store.removeDevice(deviceId)

            try {
                await deleteMutation.mutateAsync({ id: deviceId })
            } catch (err) {
                handleError(err, { title: 'Failed to delete device' })
                utils.device.list.invalidate({ siteId: activeSiteId || '' })
            }
        },
        [deleteMutation, utils, activeSiteId, handleError]
    )

    const removeMultipleDevices = useCallback(
        async (deviceIds: string[]) => {
            if (!deviceIds.length) return

            store.removeMultipleDevices(deviceIds)

            try {
                await deleteManyMutation.mutateAsync({ ids: deviceIds })
            } catch (err) {
                handleError(err, { title: 'Failed to delete devices' })
                utils.device.list.invalidate({ siteId: activeSiteId || '' })
            }
        },
        [deleteManyMutation, utils, activeSiteId, handleError]
    )

    const refreshDevices = useCallback(() => {
        refetch()
    }, [refetch])

    return {
        // Mutations
        addDevice,
        updateDevice,
        updateDevicePosition,
        updateMultipleDevices,
        removeDevice,
        removeMultipleDevices,
        refreshDevices,
        // Undo/redo from store
        undo: store.undo,
        redo: store.redo,
        canUndo: store.canUndo(),
        canRedo: store.canRedo(),
    }
}

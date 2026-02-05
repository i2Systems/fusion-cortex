/**
 * Device Actions Hook
 * 
 * Provides mutation functions for Devices.
 */

'use client'

import { useCallback, useRef } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useSiteStore } from '@/lib/stores/siteStore'
import { useDeviceStore } from '@/lib/stores/deviceStore'
import { useErrorHandler } from '@/lib/hooks/useErrorHandler'
import type { Device } from '@/lib/mockData'

export function useDeviceActions() {
    const activeSiteId = useSiteStore((s) => s.activeSiteId)
    const utils = trpc.useUtils()
    const { handleError } = useErrorHandler()

    // Debounce timer for position updates
    const positionUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

    const addDevice = useCallback(
        async (device: Device) => {
            const currentSiteId = useSiteStore.getState().activeSiteId
            if (!currentSiteId || !device.type) return

            useDeviceStore.getState().addDevice(device)

            try {
                await createMutation.mutateAsync({
                    siteId: currentSiteId,
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
                useDeviceStore.getState().removeDevice(device.id)
            }
        },
        [createMutation, handleError]
    )

    const updateDevice = useCallback(
        async (deviceId: string, updates: Partial<Device>) => {
            useDeviceStore.getState().updateDevice(deviceId, updates)

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
                const currentSiteId = useSiteStore.getState().activeSiteId
                utils.device.list.invalidate({ siteId: currentSiteId || '' })
            }
        },
        [updateMutation, utils, handleError]
    )

    const updateDevicePosition = useCallback(
        (deviceId: string, x: number, y: number) => {
            useDeviceStore.getState().updateDevicePosition(deviceId, x, y)

            if (positionUpdateTimeoutRef.current) {
                clearTimeout(positionUpdateTimeoutRef.current)
            }

            positionUpdateTimeoutRef.current = setTimeout(async () => {
                try {
                    await updateMutation.mutateAsync({ id: deviceId, x, y })
                } catch (err) {
                    handleError(err, { title: 'Failed to save position' })
                    const currentSiteId = useSiteStore.getState().activeSiteId
                    utils.device.list.invalidate({ siteId: currentSiteId || '' })
                }
            }, 1000)
        },
        [updateMutation, utils, handleError]
    )

    const updateMultipleDevices = useCallback(
        async (updates: Array<{ deviceId: string; updates: Partial<Device> }>) => {
            useDeviceStore.getState().updateMultipleDevices(updates)

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
                const currentSiteId = useSiteStore.getState().activeSiteId
                utils.device.list.invalidate({ siteId: currentSiteId || '' })
            }
        },
        [updateMutation, utils, handleError]
    )

    const removeDevice = useCallback(
        async (deviceId: string) => {
            useDeviceStore.getState().removeDevice(deviceId)

            try {
                await deleteMutation.mutateAsync({ id: deviceId })
            } catch (err) {
                handleError(err, { title: 'Failed to delete device' })
                const currentSiteId = useSiteStore.getState().activeSiteId
                utils.device.list.invalidate({ siteId: currentSiteId || '' })
            }
        },
        [deleteMutation, utils, handleError]
    )

    const removeMultipleDevices = useCallback(
        async (deviceIds: string[]) => {
            if (!deviceIds.length) return

            useDeviceStore.getState().removeMultipleDevices(deviceIds)

            try {
                await deleteManyMutation.mutateAsync({ ids: deviceIds })
            } catch (err) {
                handleError(err, { title: 'Failed to delete devices' })
                const currentSiteId = useSiteStore.getState().activeSiteId
                utils.device.list.invalidate({ siteId: currentSiteId || '' })
            }
        },
        [deleteManyMutation, utils, handleError]
    )

    const refreshDevices = useCallback(() => {
        const currentSiteId = useSiteStore.getState().activeSiteId
        utils.device.list.invalidate({ siteId: currentSiteId || '' })
    }, [utils])

    // Get undo/redo from store
    const store = useDeviceStore()

    return {
        addDevice,
        updateDevice,
        updateDevicePosition,
        updateMultipleDevices,
        removeDevice,
        removeMultipleDevices,
        refreshDevices,
        // Undo/redo from store - these need to be from the subscribed store
        undo: store.undo,
        redo: store.redo,
        canUndo: store.canUndo(),
        canRedo: store.canRedo(),
    }
}

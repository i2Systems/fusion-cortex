/**
 * Device Data Sync Hook
 * 
 * Fetches device data from the server and keeps the DeviceStore in sync.
 * Should only be used ONCE in the root application layout (StateHydration).
 */

'use client'

import { useEffect, useRef } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useSiteStore } from '@/lib/stores/siteStore'
import { useDeviceStore } from '@/lib/stores/deviceStore'
import { useErrorHandler } from '@/lib/hooks/useErrorHandler'

export function useDeviceDataSync() {
    const activeSiteId = useSiteStore((s) => s.activeSiteId)
    const activeSite = useSiteStore((s) => s.sites.find(site => site.id === s.activeSiteId))
    const store = useDeviceStore()
    const { handleError } = useErrorHandler()

    const ensuredSiteIdRef = useRef<string | null>(null)
    const previousSiteIdRef = useRef<string | null>(null)

    // Ensure site exists mutation
    const ensureSiteMutation = trpc.site.ensureExists.useMutation()

    // Fetch devices from database
    const { data: devicesData, isLoading, error } = trpc.device.list.useQuery(
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

    // Sync loading/error state
    useEffect(() => {
        store.setLoading(isLoading)
    }, [isLoading, store])

    useEffect(() => {
        if (error) {
            store.setError(error)
            handleError(error, { title: 'Failed to load devices' })
        }
    }, [error, store, handleError])

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
    }, [activeSiteId, activeSite, ensureSiteMutation])

    // Clear devices on site change
    useEffect(() => {
        if (activeSiteId !== previousSiteIdRef.current && previousSiteIdRef.current !== null) {
            store.setDevices([])
        }
        previousSiteIdRef.current = activeSiteId
    }, [activeSiteId, store])

    // Hydrate store
    useEffect(() => {
        if (devicesData !== undefined) {
            store.setDevices(devicesData)
        }
    }, [devicesData, store])
}

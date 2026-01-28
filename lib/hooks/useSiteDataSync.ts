/**
 * Site Data Sync Hook
 * 
 * Fetches site data from the server and keeps the SiteStore in sync.
 * Should only be used ONCE in the root application layout (StateHydration).
 */

'use client'

import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { useSiteStore, Site } from '@/lib/stores/siteStore'

export function useSiteDataSync() {
    const store = useSiteStore()
    const searchParams = useSearchParams()

    // Fetch sites from database
    const { data: sitesData, isLoading } = trpc.site.list.useQuery(undefined, {
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })

    // Sync loading state
    useEffect(() => {
        store.setLoading(isLoading)
    }, [isLoading, store])

    // Map database sites to Site interface
    const mappedSites = useMemo<Site[]>(() => {
        if (!sitesData) return []
        return sitesData.map(site => ({
            id: site.id,
            name: site.name,
            siteNumber: site.storeNumber || '',
            address: site.address ?? undefined,
            city: site.city ?? undefined,
            state: site.state ?? undefined,
            zipCode: site.zipCode ?? undefined,
            phone: site.phone ?? undefined,
            manager: site.manager ?? undefined,
            squareFootage: site.squareFootage ?? undefined,
            openedDate: site.openedDate ?? undefined,
            imageUrl: (site as any).imageUrl ?? undefined,
        }))
    }, [sitesData])

    // Hydrate store
    useEffect(() => {
        if (mappedSites.length > 0 || !isLoading) {
            store.setSites(mappedSites)
        }
    }, [mappedSites, isLoading, store])

    // Handle URL deep linking
    const urlSiteId = searchParams?.get('siteId')
    useEffect(() => {
        if (urlSiteId && urlSiteId !== store.activeSiteId) {
            // Validate site exists before switching
            const siteExists = store.sites.some(s => s.id === urlSiteId)
            // If site exists, switch to it
            if (siteExists) {
                store.setActiveSiteId(urlSiteId)
            }
        }
    }, [urlSiteId, store.activeSiteId, store.sites, store])
}

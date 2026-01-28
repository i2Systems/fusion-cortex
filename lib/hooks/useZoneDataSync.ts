/**
 * Zone Data Sync Hook
 */

'use client'

import { useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useSiteStore } from '@/lib/stores/siteStore'
import { useZoneStore } from '@/lib/stores/zoneStore'

export function useZoneDataSync() {
    const activeSiteId = useSiteStore((s) => s.activeSiteId)
    const store = useZoneStore()

    // Fetch zones from database
    const { data: zonesData, refetch } = trpc.zone.list.useQuery(
        { siteId: activeSiteId || '' },
        {
            enabled: !!activeSiteId,
            refetchOnWindowFocus: false,
        }
    )

    // Hydrate store
    useEffect(() => {
        if (zonesData) {
            const transformed = zonesData.map((zone) => ({
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
        } else if (!activeSiteId) {
            store.setZones([])
        }
    }, [zonesData, activeSiteId, store])
}

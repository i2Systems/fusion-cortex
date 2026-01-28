/**
 * Rule Data Sync Hook
 */

'use client'

import { useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useSiteStore } from '@/lib/stores/siteStore'
import { useRuleStore } from '@/lib/stores/ruleStore'

export function useRuleDataSync() {
    const activeSiteId = useSiteStore((s) => s.activeSiteId)
    const store = useRuleStore()

    const { data: rulesData, isLoading } = trpc.rule.list.useQuery(
        { siteId: activeSiteId || '' },
        {
            enabled: !!activeSiteId,
            refetchOnWindowFocus: false,
        }
    )

    useEffect(() => {
        store.setLoading(isLoading)
    }, [isLoading, store])

    useEffect(() => {
        if (rulesData) {
            store.setRules(rulesData)
        } else if (!activeSiteId) {
            store.setRules([])
        }
    }, [rulesData, activeSiteId, store])
}

/**
 * useSite Hook
 * 
 * Main consumer hook for Site data and actions.
 * Replaces the old SiteContext usage.
 */

'use client'

import { useSiteStore } from '@/lib/stores/siteStore'
import { useSiteActions } from '@/lib/hooks/useSiteActions'

export function useSite() {
    const store = useSiteStore()
    const actions = useSiteActions()

    const activeSite = store.activeSiteId
        ? store.sites.find(s => s.id === store.activeSiteId) || null
        : null

    const getSiteById = (siteId: string) => {
        return store.sites.find(s => s.id === siteId)
    }

    return {
        // State
        sites: store.sites,
        activeSiteId: store.activeSiteId,
        activeSite,
        isLoading: store.isLoading,

        // Helpers
        getSiteById,

        // Actions
        setActiveSite: actions.setActiveSite,
        addSite: actions.addSite,
        updateSite: actions.updateSite,
        removeSite: actions.removeSite,
    }
}

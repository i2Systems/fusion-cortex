/**
 * Site Store
 * 
 * Zustand store for managing site state.
 * Replaces SiteContext for data storage.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Site interface - matches SiteContext definition
export interface Site {
    id: string
    name: string
    siteNumber: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
    phone?: string
    manager?: string
    squareFootage?: number
    openedDate?: Date
    imageUrl?: string
}

interface SiteState {
    sites: Site[]
    activeSiteId: string | null
    isLoading: boolean
    isSwitching: boolean
    switchingSiteName: string | null

    // Actions
    setSites: (sites: Site[]) => void
    setActiveSiteId: (id: string | null) => void
    setLoading: (isLoading: boolean) => void
    setSwitching: (isSwitching: boolean, siteName?: string | null) => void
    addSite: (site: Site) => void
    updateSite: (id: string, updates: Partial<Site>) => void
    removeSite: (id: string) => void
}

export const useSiteStore = create<SiteState>()(
    persist(
        (set) => ({
            sites: [],
            activeSiteId: null,
            isLoading: false,
            isSwitching: false,
            switchingSiteName: null,

            setSites: (sites) => set({ sites }),

            setActiveSiteId: (activeSiteId) => set({ activeSiteId }),

            setLoading: (isLoading) => set({ isLoading }),

            setSwitching: (isSwitching, siteName = null) => set({
                isSwitching,
                switchingSiteName: siteName
            }),

            addSite: (site) => set((state) => ({
                sites: [...state.sites, site]
            })),

            updateSite: (id, updates) => set((state) => ({
                sites: state.sites.map((s) => s.id === id ? { ...s, ...updates } : s)
            })),

            removeSite: (id) => set((state) => {
                const newSites = state.sites.filter((s) => s.id !== id)
                // If active site is removed, switch to another one or null
                let newActiveId = state.activeSiteId
                if (state.activeSiteId === id) {
                    newActiveId = newSites.length > 0 ? newSites[0].id : null
                }
                return {
                    sites: newSites,
                    activeSiteId: newActiveId
                }
            }),
        }),
        {
            name: 'fusion-site-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ activeSiteId: state.activeSiteId }), // Only persist activeSiteId
        }
    )
)

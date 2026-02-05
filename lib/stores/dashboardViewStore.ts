/**
 * Dashboard View Store
 *
 * Holds the dashboard view mode (cards | map) so it can be controlled
 * from the header toggle next to breadcrumbs.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DashboardViewMode = 'cards' | 'map'

interface DashboardViewState {
  viewMode: DashboardViewMode
  setViewMode: (mode: DashboardViewMode) => void
}

export const useDashboardViewStore = create<DashboardViewState>()(
  persist(
    (set) => ({
      viewMode: 'cards',
      setViewMode: (viewMode) => set({ viewMode }),
    }),
    { name: 'fusion-dashboard-view', partialize: (s) => ({ viewMode: s.viewMode }) }
  )
)

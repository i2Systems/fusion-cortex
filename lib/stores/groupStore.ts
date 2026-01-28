import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface Group {
    id: string
    name: string
    description?: string
    color: string
    siteId: string
    deviceIds: string[]
    personIds: string[]
    createdAt: Date
    updatedAt: Date
}

interface GroupState {
    groups: Group[]

    // Actions
    setGroups: (groups: Group[]) => void
    addGroup: (group: Group) => void
    updateGroup: (groupId: string, updates: Partial<Group>) => void
    removeGroup: (groupId: string) => void
}

export const useGroupStore = create<GroupState>()(
    immer((set) => ({
        groups: [],

        setGroups: (groups) =>
            set((state) => {
                state.groups = groups
            }),

        addGroup: (group) =>
            set((state) => {
                state.groups.push(group)
            }),

        updateGroup: (groupId, updates) =>
            set((state) => {
                const index = state.groups.findIndex((g) => g.id === groupId)
                if (index >= 0) {
                    state.groups[index] = { ...state.groups[index], ...updates, updatedAt: new Date() }
                }
            }),

        removeGroup: (groupId) =>
            set((state) => {
                state.groups = state.groups.filter((g) => g.id !== groupId)
            }),
    }))
)

// Selector for groups array (renamed to avoid conflict with hooks/useGroups.ts)
export const useGroupList = () => useGroupStore((s) => s.groups)

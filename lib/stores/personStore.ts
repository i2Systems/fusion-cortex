import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface Person {
    id: string
    firstName: string
    lastName: string
    email?: string | null
    role?: string | null
    imageUrl?: string | null
    x?: number | null
    y?: number | null
    siteId: string
    createdAt: Date
    updatedAt: Date
}

interface PersonState {
    people: Person[]

    // Actions
    setPeople: (people: Person[]) => void
    addPerson: (person: Person) => void
    updatePerson: (personId: string, updates: Partial<Person>) => void
    removePerson: (personId: string) => void
}

export const usePersonStore = create<PersonState>()(
    immer((set) => ({
        people: [],

        setPeople: (people) =>
            set((state) => {
                state.people = people
            }),

        addPerson: (person) =>
            set((state) => {
                state.people.push(person)
            }),

        updatePerson: (personId, updates) =>
            set((state) => {
                const index = state.people.findIndex((p) => p.id === personId)
                if (index >= 0) {
                    state.people[index] = { ...state.people[index], ...updates, updatedAt: new Date() }
                }
            }),

        removePerson: (personId) =>
            set((state) => {
                state.people = state.people.filter((p) => p.id !== personId)
            }),
    }))
)

// Selector for people array (renamed to avoid conflict with hooks/usePeople.ts)
export const usePersonList = () => usePersonStore((s) => s.people)

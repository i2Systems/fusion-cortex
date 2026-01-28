import { usePersonStore } from '@/lib/stores/personStore'
import { trpc } from '@/lib/trpc/client'

export function usePeople() {
    const store = usePersonStore()
    const utils = trpc.useUtils()

    const createMutation = trpc.person.create.useMutation({
        onSuccess: (newPerson) => {
            queueMicrotask(() => {
                store.addPerson({
                    ...newPerson,
                    imageUrl: newPerson.imageUrl || undefined,
                    createdAt: new Date(newPerson.createdAt),
                    updatedAt: new Date(newPerson.updatedAt)
                })
            })
            utils.person.list.invalidate()
        }
    })

    const updateMutation = trpc.person.update.useMutation({
        onSuccess: (updatedPerson) => {
            queueMicrotask(() => {
                store.updatePerson(updatedPerson.id, {
                    ...updatedPerson,
                    imageUrl: updatedPerson.imageUrl || undefined,
                    updatedAt: new Date(updatedPerson.updatedAt)
                })
            })
            utils.person.list.invalidate()
        }
    })

    const deleteMutation = trpc.person.delete.useMutation({
        onSuccess: (deletedPerson) => {
            queueMicrotask(() => {
                store.removePerson(deletedPerson.id)
            })
            utils.person.list.invalidate()
        }
    })

    const fetchPeople = async (siteId: string) => {
        const people = await utils.person.list.fetch({ siteId })
        const mappedPeople = people.map(p => ({
            ...p,
            imageUrl: p.imageUrl || undefined,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt)
        }))
        // Use queueMicrotask to avoid React error #185 (updating during render)
        queueMicrotask(() => {
            store.setPeople(mappedPeople)
        })
    }

    return {
        people: store.people,
        addPerson: createMutation.mutateAsync,
        updatePerson: updateMutation.mutateAsync,
        deletePerson: deleteMutation.mutateAsync,
        fetchPeople
    }
}

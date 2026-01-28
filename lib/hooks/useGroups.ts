import { useGroupStore } from '@/lib/stores/groupStore'
import { trpc } from '@/lib/trpc/client'

export function useGroups() {
    const store = useGroupStore()
    const utils = trpc.useUtils()

    const createMutation = trpc.group.create.useMutation({
        onSuccess: (newGroup) => {
            queueMicrotask(() => {
                store.addGroup({
                    ...newGroup,
                    description: newGroup.description || undefined,
                    personIds: newGroup.personIds || [],
                    createdAt: new Date(newGroup.createdAt),
                    updatedAt: new Date(newGroup.updatedAt)
                })
            })
            utils.group.list.invalidate()
        }
    })

    const updateMutation = trpc.group.update.useMutation({
        onSuccess: (updatedGroup) => {
            queueMicrotask(() => {
                store.updateGroup(updatedGroup.id, {
                    ...updatedGroup,
                    description: updatedGroup.description || undefined,
                    personIds: updatedGroup.personIds || [],
                    updatedAt: new Date(updatedGroup.updatedAt)
                })
            })
            utils.group.list.invalidate()
        }
    })

    const deleteMutation = trpc.group.delete.useMutation({
        onSuccess: (deletedGroup) => {
            queueMicrotask(() => {
                store.removeGroup(deletedGroup.id)
            })
            utils.group.list.invalidate()
        }
    })

    const fetchGroups = async (siteId: string) => {
        // In a real app we might want to use useQuery in the component
        // But for sync compatibility we can use the utils client
        const groups = await utils.group.list.fetch({ siteId })
        const mappedGroups = groups.map(g => ({
            ...g,
            description: g.description || undefined,
            personIds: g.personIds || [],
            createdAt: new Date(g.createdAt),
            updatedAt: new Date(g.updatedAt)
        }))
        // Use queueMicrotask to avoid React error #185 (updating during render)
        queueMicrotask(() => {
            store.setGroups(mappedGroups)
        })
    }

    return {
        groups: store.groups,
        addGroup: createMutation.mutateAsync,
        updateGroup: updateMutation.mutateAsync,
        deleteGroup: deleteMutation.mutateAsync,
        fetchGroups
    }
}

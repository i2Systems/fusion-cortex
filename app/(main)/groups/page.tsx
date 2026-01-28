'use client'

import { useState, useRef, useEffect } from 'react'
import { SearchIsland } from '@/components/layout/SearchIsland'
import { ResizablePanel } from '@/components/layout/ResizablePanel'
import { GroupsListView } from '@/components/groups/GroupsListView'
import { GroupsPanel } from '@/components/groups/GroupsPanel'
import { GroupsViewToggle, type GroupsFilterMode } from '@/components/groups/GroupsViewToggle'
import { useGroups } from '@/lib/hooks/useGroups'
import { usePeople } from '@/lib/hooks/usePeople'
import { useSite } from '@/lib/SiteContext'
import { useDevices } from '@/lib/DomainContext'
import { useToast } from '@/lib/ToastContext'

export default function GroupsPage() {
    const { groups, addGroup, updateGroup, deleteGroup, fetchGroups } = useGroups()
    const { activeSiteId } = useSite()
    const { devices } = useDevices()
    const { people, fetchPeople } = usePeople()
    const { addToast } = useToast()

    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterMode, setFilterMode] = useState<GroupsFilterMode>('both')
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    // Fetch groups and people when site changes
    useEffect(() => {
        if (activeSiteId) {
            fetchGroups(activeSiteId).catch(console.error)
            fetchPeople(activeSiteId).catch(console.error)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSiteId])

    const handleMainContentClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement
        if (
            mapContainerRef.current &&
            panelRef.current &&
            !mapContainerRef.current.contains(target) &&
            !panelRef.current.contains(target)
        ) {
            setSelectedGroupId(null)
        }
    }

    const handleCreateGroup = async () => {
        if (!activeSiteId) {
            addToast({ type: 'error', title: 'Error', message: 'No site selected' })
            return
        }

        try {
            const newGroup = await addGroup({
                name: 'New Group',
                description: '',
                color: '#4c7dff',
                siteId: activeSiteId,
                deviceIds: [],
                personIds: [],
            })
            setSelectedGroupId(newGroup.id)
            addToast({ type: 'success', title: 'Group Created', message: 'New group created successfully' })
        } catch (error) {
            console.error('Failed to create group:', error)
            addToast({ type: 'error', title: 'Error', message: 'Failed to create group' })
        }
    }

    const handleDeleteGroup = async (groupId: string) => {
        try {
            await deleteGroup(groupId)
            if (selectedGroupId === groupId) {
                setSelectedGroupId(null)
            }
            addToast({ type: 'success', title: 'Group Deleted', message: 'Group deleted successfully' })
        } catch (error) {
            console.error('Failed to delete group:', error)
            addToast({ type: 'error', title: 'Error', message: 'Failed to delete group' })
        }
    }

    const handleDeleteGroups = async (groupIds: string[]) => {
        try {
            await Promise.all(groupIds.map(id => deleteGroup(id)))
            if (selectedGroupId && groupIds.includes(selectedGroupId)) {
                setSelectedGroupId(null)
            }
            addToast({ type: 'success', title: 'Groups Deleted', message: `${groupIds.length} groups deleted successfully` })
        } catch (error) {
            console.error('Failed to delete groups:', error)
            addToast({ type: 'error', title: 'Error', message: 'Failed to delete groups' })
        }
    }

    const handleAddToGroup = async (groupId: string, itemIds: string[], type: 'devices' | 'people'): Promise<void> => {
        const group = groups.find(g => g.id === groupId)
        if (!group) return

        try {
            if (type === 'devices') {
                const newDeviceIds = [...new Set([...group.deviceIds, ...itemIds])]
                await updateGroup({
                    id: groupId,
                    deviceIds: newDeviceIds,
                })
            } else {
                const currentPersonIds = group.personIds || []
                const newPersonIds = [...new Set([...currentPersonIds, ...itemIds])]
                await updateGroup({
                    id: groupId,
                    personIds: newPersonIds,
                })
            }
            addToast({ type: 'success', title: 'Added to Group', message: `${itemIds.length} ${type} added to ${group.name}` })
        } catch (error) {
            console.error('Failed to add to group:', error)
            addToast({ type: 'error', title: 'Error', message: 'Failed to add items to group' })
        }
    }

    const handleItemMove = async (itemId: string, itemType: 'person' | 'device', fromGroupId: string | null, toGroupId: string) => {
        
        // Remove from old group if exists
        if (fromGroupId) {
            const fromGroup = groups.find(g => g.id === fromGroupId)
            if (fromGroup) {
                try {
                    if (itemType === 'person') {
                        const newPersonIds = (fromGroup.personIds || []).filter(id => id !== itemId)
                        await updateGroup({ id: fromGroupId, personIds: newPersonIds })
                    } else {
                        const newDeviceIds = fromGroup.deviceIds.filter(id => id !== itemId)
                        await updateGroup({ id: fromGroupId, deviceIds: newDeviceIds })
                    }
                } catch (error) {
                    console.error('Failed to remove from old group:', error)
                }
            }
        }

        // Add to new group
        const toGroup = groups.find(g => g.id === toGroupId)
        if (toGroup) {
            try {
                if (itemType === 'person') {
                    const newPersonIds = [...new Set([...(toGroup.personIds || []), itemId])]
                    await updateGroup({ id: toGroupId, personIds: newPersonIds })
                } else {
                    const newDeviceIds = [...new Set([...toGroup.deviceIds, itemId])]
                    await updateGroup({ id: toGroupId, deviceIds: newDeviceIds })
                }
                addToast({ type: 'success', title: 'Moved', message: `${itemType === 'person' ? 'Person' : 'Device'} moved to ${toGroup.name}` })
            } catch (error) {
                console.error('Failed to add to new group:', error)
                addToast({ type: 'error', title: 'Error', message: 'Failed to move item' })
            }
        }
    }

    return (
        <div className="h-full flex flex-col min-h-0 overflow-hidden">
            {/* Top Search Island */}
            <div className="flex-shrink-0 page-padding-x pt-3 md:pt-4 pb-2 md:pb-3 relative">
                <SearchIsland
                    position="top"
                    fullWidth={true}
                    showActions={true}
                    title="Groups"
                    subtitle="Manage groups of devices and people"
                    placeholder="Search groups..."
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    onActionDetected={(action) => {
                        if (action.id === 'create-group') {
                            handleCreateGroup()
                        }
                    }}
                />
            </div>

            {/* Main Content */}
            <div
                className="main-content-area flex-1 flex min-h-0 gap-2 md:gap-4 page-padding-x pb-12 md:pb-14"
                style={{ overflow: 'visible' }}
                onClick={handleMainContentClick}
            >
                {/* List View - Left Side */}
                <div
                    ref={mapContainerRef}
                    className="flex-1 relative min-w-0 flex flex-col"
                    style={{ overflow: 'visible', minHeight: 0 }}
                >
                    {/* Filter Tabs */}
                    <div className="mb-2 md:mb-3 flex items-center justify-between">
                        <GroupsViewToggle currentFilter={filterMode} onFilterChange={setFilterMode} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-h-0 rounded-2xl shadow-[var(--shadow-strong)] border border-[var(--color-border-subtle)] overflow-hidden">
                        <div className="w-full h-full bg-[var(--color-surface)]">
                            <GroupsListView
                                groups={groups}
                                selectedGroupId={selectedGroupId}
                                onGroupSelect={setSelectedGroupId}
                                searchQuery={searchQuery}
                                filterMode={filterMode}
                                people={people}
                                devices={devices}
                                onItemMove={handleItemMove}
                            />
                        </div>
                    </div>
                </div>

                {/* Groups Panel - Right Side */}
                <div ref={panelRef}>
                    <ResizablePanel
                        defaultWidth={384}
                        minWidth={320}
                        maxWidth={512}
                        collapseThreshold={200}
                        storageKey="groups_panel"
                    >
                        <GroupsPanel
                            groups={groups}
                            selectedGroupId={selectedGroupId}
                            onGroupSelect={setSelectedGroupId}
                            onCreateGroup={handleCreateGroup}
                            onDeleteGroup={handleDeleteGroup}
                            onDeleteGroups={handleDeleteGroups}
                            onItemMove={handleItemMove}
                            onEditGroup={async (groupId, updates) => {
                                try {
                                    await updateGroup({
                                        id: groupId,
                                        name: updates.name,
                                        description: updates.description,
                                        color: updates.color,
                                        deviceIds: updates.deviceIds,
                                        personIds: updates.personIds,
                                    })
                                    addToast({ type: 'success', title: 'Group Updated', message: 'Group updated successfully' })
                                } catch (e) {
                                    console.error(e)
                                    addToast({ type: 'error', title: 'Error', message: 'Failed to update group' })
                                }
                            }}
                            devices={devices}
                            people={people}
                            filterMode={filterMode}
                            onAddToGroup={handleAddToGroup}
                        />
                    </ResizablePanel>
                </div>
            </div>
        </div>
    )
}

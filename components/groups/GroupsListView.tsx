/**
 * Groups List View Component
 * 
 * Displays groups as columns with people/devices as tokens.
 * Matches the Zones list view style.
 */

'use client'

import { useMemo, useCallback, useState, memo } from 'react'
import { Users, Monitor, Layers, Wifi, WifiOff } from 'lucide-react'
import { Group } from '@/lib/stores/groupStore'
import { Person } from '@/lib/stores/personStore'
import { Device } from '@/lib/mockData'
import { GroupsFilterMode } from './GroupsViewToggle'
import { getStatusTokenClass, getSignalTokenClass } from '@/lib/styleUtils'

interface GroupsListViewProps {
    groups: Group[]
    selectedGroupId: string | null
    onGroupSelect: (groupId: string | null) => void
    searchQuery: string
    filterMode?: GroupsFilterMode
    people?: Person[]
    devices?: Device[]
    onItemMove?: (itemId: string, itemType: 'person' | 'device', fromGroupId: string | null, toGroupId: string) => void
}

// Person Card Component
interface PersonCardProps {
    person: Person
    groupId: string | null
    onDragStart: (e: React.DragEvent, person: Person, groupId: string | null) => void
    onDragEnd: () => void
}

const PersonCard = memo(function PersonCard({ person, groupId, onDragStart, onDragEnd }: PersonCardProps) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, person, groupId)}
            onDragEnd={onDragEnd}
            className="group p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]/50 cursor-move transition-all"
        >
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center flex-shrink-0">
                    <Users size={12} className="text-[var(--color-primary)]" />
                </div>
                <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-[var(--color-text)] truncate block">
                        {person.firstName} {person.lastName}
                    </span>
                    {person.role && (
                        <span className="text-xs text-[var(--color-text-muted)] truncate block">
                            {person.role}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
})

// Device Card Component
interface DeviceCardProps {
    device: Device
    groupId: string | null
    onDragStart: (e: React.DragEvent, device: Device, groupId: string | null) => void
    onDragEnd: () => void
}

const DeviceCard = memo(function DeviceCard({ device, groupId, onDragStart, onDragEnd }: DeviceCardProps) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, device, groupId)}
            onDragEnd={onDragEnd}
            className="group p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]/50 cursor-move transition-all"
        >
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--color-text)] truncate">
                    {device.deviceId}
                </span>
                <span className={getStatusTokenClass(device.status)}>
                    {device.status}
                </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                {device.signal > 0 ? (
                    <div className={getSignalTokenClass(device.signal)}>
                        <Wifi size={12} />
                        <span className="text-xs">{device.signal}%</span>
                    </div>
                ) : (
                    <div className="token token-data">
                        <WifiOff size={12} />
                        <span className="text-xs">—</span>
                    </div>
                )}
                <span className="text-xs text-[var(--color-text-muted)] capitalize">
                    {device.type}
                </span>
            </div>
        </div>
    )
})

export function GroupsListView({ 
    groups, 
    selectedGroupId, 
    onGroupSelect, 
    searchQuery, 
    filterMode = 'both',
    people = [],
    devices = [],
    onItemMove
}: GroupsListViewProps) {
    const [draggedItem, setDraggedItem] = useState<{ item: Person | Device; type: 'person' | 'device'; fromGroupId: string | null } | null>(null)
    const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null)

    // Filter groups by search
    const filteredGroups = useMemo(() => {
        let result = groups

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase()
            result = result.filter(g =>
                g.name.toLowerCase().includes(lowerQuery) ||
                g.description?.toLowerCase().includes(lowerQuery)
            )
        }

        return result
    }, [groups, searchQuery])

    // Create maps for quick lookup
    const personMap = useMemo(() => new Map(people.map(p => [p.id, p])), [people])
    const deviceMap = useMemo(() => new Map(devices.map(d => [d.id, d])), [devices])

    // Get ungrouped items
    const allGroupedPersonIds = useMemo(() => {
        const ids = new Set<string>()
        groups.forEach(g => g.personIds?.forEach(id => ids.add(id)))
        return ids
    }, [groups])

    const allGroupedDeviceIds = useMemo(() => {
        const ids = new Set<string>()
        groups.forEach(g => g.deviceIds.forEach(id => ids.add(id)))
        return ids
    }, [groups])

    const ungroupedPeople = useMemo(() => {
        return people.filter(p => !allGroupedPersonIds.has(p.id))
    }, [people, allGroupedPersonIds])

    const ungroupedDevices = useMemo(() => {
        return devices.filter(d => !allGroupedDeviceIds.has(d.id))
    }, [devices, allGroupedDeviceIds])

    // Drag handlers
    const handlePersonDragStart = useCallback((e: React.DragEvent, person: Person, groupId: string | null) => {
        setDraggedItem({ item: person, type: 'person', fromGroupId: groupId })
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', '')
    }, [])

    const handleDeviceDragStart = useCallback((e: React.DragEvent, device: Device, groupId: string | null) => {
        setDraggedItem({ item: device, type: 'device', fromGroupId: groupId })
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', '')
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent, groupId: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverGroupId(groupId)
    }, [])

    const handleDragLeave = useCallback(() => {
        setDragOverGroupId(null)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent, toGroupId: string) => {
        e.preventDefault()
        
        // Check if data came from panel (JSON format)
        try {
            const jsonData = e.dataTransfer.getData('application/json')
            if (jsonData) {
                const data = JSON.parse(jsonData)
                if ((data.type === 'device' || data.type === 'person') && data.itemId && onItemMove) {
                    onItemMove(data.itemId, data.type, data.fromGroupId, toGroupId)
                    setDraggedItem(null)
                    setDragOverGroupId(null)
                    return
                }
            }
        } catch (err) {
            // Not JSON data, continue with normal flow
        }
        
        // Normal drag from within the list
        if (draggedItem && onItemMove) {
            onItemMove(draggedItem.item.id, draggedItem.type, draggedItem.fromGroupId, toGroupId)
        }
        setDraggedItem(null)
        setDragOverGroupId(null)
    }, [draggedItem, onItemMove])

    const handleDragEnd = useCallback(() => {
        setDraggedItem(null)
        setDragOverGroupId(null)
    }, [])

    const columnCount = Math.max(1, filteredGroups.length)

    return (
        <div className="h-full flex flex-col">
            {/* Groups Grid */}
            <div className="flex-1 overflow-auto p-4">
                <div 
                    className="grid gap-4" 
                    style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(220px, 1fr))` }}
                >
                    {/* Group Columns */}
                    {filteredGroups.map((group) => {
                        const groupPeople = (group.personIds || []).map(id => personMap.get(id)).filter(Boolean) as Person[]
                        const groupDevices = group.deviceIds.map(id => deviceMap.get(id)).filter(Boolean) as Device[]
                        const isSelected = selectedGroupId === group.id
                        const isDragOver = dragOverGroupId === group.id

                        const showPeople = filterMode === 'people' || filterMode === 'both'
                        const showDevices = filterMode === 'devices' || filterMode === 'both'

                        return (
                            <div
                                key={group.id}
                                className={`
                                    flex flex-col rounded-lg border-2 transition-all
                                    ${isSelected
                                        ? 'border-[var(--color-primary)] shadow-[var(--shadow-glow-primary)]'
                                        : 'border-[var(--color-border-subtle)]'
                                    }
                                    ${isDragOver ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]/30' : ''}
                                `}
                                onDragOver={(e) => handleDragOver(e, group.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, group.id)}
                                onClick={() => onGroupSelect?.(isSelected ? null : group.id)}
                            >
                                {/* Group Header */}
                                <div
                                    className="p-3 rounded-t-lg border-b border-[var(--color-border-subtle)] cursor-pointer"
                                    style={{
                                        backgroundColor: `${group.color}20`,
                                        borderColor: isSelected ? group.color : undefined
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-sm text-[var(--color-text)]">
                                            {group.name}
                                        </h4>
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: group.color }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                                        {showPeople && (
                                            <span className="flex items-center gap-1">
                                                <Users size={12} />
                                                {groupPeople.length}
                                            </span>
                                        )}
                                        {showDevices && (
                                            <span className="flex items-center gap-1">
                                                <Monitor size={12} />
                                                {groupDevices.length}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="flex-1 p-3 space-y-2 min-h-[200px] bg-[var(--color-surface-subtle)]/30 rounded-b-lg overflow-auto max-h-[400px]">
                                    {/* People Section */}
                                    {showPeople && groupPeople.length > 0 && (
                                        <>
                                            {filterMode === 'both' && (
                                                <div className="text-xs font-medium text-[var(--color-text-muted)] mb-1 flex items-center gap-1">
                                                    <Users size={10} />
                                                    People
                                                </div>
                                            )}
                                            {groupPeople.map((person) => (
                                                <PersonCard
                                                    key={person.id}
                                                    person={person}
                                                    groupId={group.id}
                                                    onDragStart={handlePersonDragStart}
                                                    onDragEnd={handleDragEnd}
                                                />
                                            ))}
                                        </>
                                    )}

                                    {/* Devices Section */}
                                    {showDevices && groupDevices.length > 0 && (
                                        <>
                                            {filterMode === 'both' && groupPeople.length > 0 && (
                                                <div className="text-xs font-medium text-[var(--color-text-muted)] mb-1 mt-3 flex items-center gap-1">
                                                    <Monitor size={10} />
                                                    Devices
                                                </div>
                                            )}
                                            {filterMode === 'both' && groupPeople.length === 0 && (
                                                <div className="text-xs font-medium text-[var(--color-text-muted)] mb-1 flex items-center gap-1">
                                                    <Monitor size={10} />
                                                    Devices
                                                </div>
                                            )}
                                            {groupDevices.map((device) => (
                                                <DeviceCard
                                                    key={device.id}
                                                    device={device}
                                                    groupId={group.id}
                                                    onDragStart={handleDeviceDragStart}
                                                    onDragEnd={handleDragEnd}
                                                />
                                            ))}
                                        </>
                                    )}

                                    {/* Empty State */}
                                    {((showPeople && groupPeople.length === 0) && (showDevices && groupDevices.length === 0)) && (
                                        <div className="text-xs text-[var(--color-text-soft)] text-center py-8 italic">
                                            No items
                                        </div>
                                    )}
                                    {showPeople && !showDevices && groupPeople.length === 0 && (
                                        <div className="text-xs text-[var(--color-text-soft)] text-center py-8 italic">
                                            No people
                                        </div>
                                    )}
                                    {showDevices && !showPeople && groupDevices.length === 0 && (
                                        <div className="text-xs text-[var(--color-text-soft)] text-center py-8 italic">
                                            No devices
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}

                    {/* Empty State when no groups */}
                    {filteredGroups.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center h-64 text-[var(--color-text-muted)]">
                            <Layers size={48} className="mb-4 opacity-50" />
                            <p>No groups found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

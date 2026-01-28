'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Users, Monitor, Edit2, Trash2, Save, X, CheckSquare, Square, Plus, UserPlus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PanelEmptyState } from '@/components/shared/PanelEmptyState'
import { ConfirmationModal } from '@/components/shared/ConfirmationModal'
import { useToast } from '@/lib/ToastContext'
import { Group } from '@/lib/stores/groupStore'
import { Device } from '@/lib/mockData'
import { Person } from '@/lib/stores/personStore'
import { GroupsFilterMode } from './GroupsViewToggle'

// Constants
const DEFAULT_GROUP_COLOR = '#4c7dff'
const GROUP_COLORS = [
    '#4c7dff', '#ff4c4c', '#4cff7d', '#ffd74c', '#ff4cff', '#4cffff', '#ff8c4c', '#8c4cff'
]

interface GroupsPanelProps {
    groups: Group[]
    selectedGroupId: string | null
    onGroupSelect: (groupId: string | null) => void
    onCreateGroup: () => void
    onDeleteGroup: (groupId: string) => void
    onDeleteGroups: (groupIds: string[]) => void
    onEditGroup: (groupId: string, updates: Partial<Group>) => void
    devices: Device[]
    people?: Person[]
    filterMode?: GroupsFilterMode
    onAddToGroup?: (groupId: string, itemIds: string[], type: 'devices' | 'people') => Promise<void>
    onItemMove?: (itemId: string, itemType: 'person' | 'device', fromGroupId: string | null, toGroupId: string) => void
}

export function GroupsPanel({
    groups,
    selectedGroupId,
    onGroupSelect,
    onCreateGroup,
    onDeleteGroup,
    onDeleteGroups,
    onEditGroup,
    devices,
    people = [],
    filterMode = 'both',
    onAddToGroup,
    onItemMove
}: GroupsPanelProps) {
    const { addToast } = useToast()

    const [isEditing, setIsEditing] = useState(false)
    const [editFormData, setEditFormData] = useState<{ name: string; description: string; color: string; deviceIds: string[]; personIds: string[] }>({
        name: '',
        description: '',
        color: DEFAULT_GROUP_COLOR,
        deviceIds: [],
        personIds: []
    })

    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set())
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
    const [selectedUngroupedIds, setSelectedUngroupedIds] = useState<Set<string>>(new Set())

    const selectedGroup = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId])
    const allSelected = useMemo(() => groups.length > 0 && selectedGroupIds.size === groups.length, [groups.length, selectedGroupIds.size])

    // Get all device IDs that are in any group
    const groupedDeviceIds = useMemo(() => {
        const ids = new Set<string>()
        groups.forEach(g => g.deviceIds.forEach(id => ids.add(id)))
        return ids
    }, [groups])

    // Get all person IDs that are in any group
    const groupedPersonIds = useMemo(() => {
        const ids = new Set<string>()
        groups.forEach(g => g.personIds?.forEach(id => ids.add(id)))
        return ids
    }, [groups])

    // Ungrouped devices
    const ungroupedDevices = useMemo(() => {
        return devices.filter(d => !groupedDeviceIds.has(d.id))
    }, [devices, groupedDeviceIds])

    // Ungrouped people
    const ungroupedPeople = useMemo(() => {
        return people.filter(p => !groupedPersonIds.has(p.id))
    }, [people, groupedPersonIds])

    // Filter groups based on mode
    const filteredGroups = useMemo(() => {
        if (filterMode === 'both') return groups
        if (filterMode === 'devices') {
            return groups.filter(g => g.deviceIds.length > 0 || g.personIds?.length === 0)
        }
        if (filterMode === 'people') {
            return groups.filter(g => (g.personIds?.length || 0) > 0 || g.deviceIds.length === 0)
        }
        return groups
    }, [groups, filterMode])

    // Reset form when selection changes
    useEffect(() => {
        if (selectedGroup) {
            setEditFormData({
                name: selectedGroup.name,
                description: selectedGroup.description || '',
                color: selectedGroup.color,
                deviceIds: selectedGroup.deviceIds,
                personIds: selectedGroup.personIds || []
            })
            setIsEditing(false)
        }
    }, [selectedGroup])

    const handleStartEdit = () => setIsEditing(true)

    const handleCancelEdit = () => {
        setIsEditing(false)
        if (selectedGroup) {
            setEditFormData({
                name: selectedGroup.name,
                description: selectedGroup.description || '',
                color: selectedGroup.color,
                deviceIds: selectedGroup.deviceIds,
                personIds: selectedGroup.personIds || []
            })
        }
    }

    const handleSaveEdit = () => {
        if (!selectedGroup) return
        if (!editFormData.name.trim()) {
            addToast({ type: 'warning', title: 'Required', message: 'Name is required' })
            return
        }

        onEditGroup(selectedGroup.id, {
            name: editFormData.name,
            description: editFormData.description,
            color: editFormData.color,
        })
        setIsEditing(false)
    }

    const handleToggleGroupSelection = (groupId: string) => {
        setSelectedGroupIds(prev => {
            const next = new Set(prev)
            if (next.has(groupId)) next.delete(groupId)
            else next.add(groupId)
            return next
        })
    }

    const handleSelectAll = () => {
        if (allSelected) setSelectedGroupIds(new Set())
        else setSelectedGroupIds(new Set(filteredGroups.map(g => g.id)))
    }

    const handleConfirmDelete = () => {
        if (selectedGroup) {
            onDeleteGroup(selectedGroup.id)
            setIsDeleteModalOpen(false)
        }
    }

    const handleConfirmBulkDelete = () => {
        onDeleteGroups(Array.from(selectedGroupIds))
        setSelectedGroupIds(new Set())
        setIsBulkDeleteModalOpen(false)
    }

    const handleToggleUngrouped = (id: string) => {
        setSelectedUngroupedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleAddSelectedToGroup = async () => {
        if (!selectedGroup || selectedUngroupedIds.size === 0) return

        const selectedIds = Array.from(selectedUngroupedIds)
        const deviceIds = selectedIds.filter(id => ungroupedDevices.some(d => d.id === id))
        const personIds = selectedIds.filter(id => ungroupedPeople.some(p => p.id === id))

        try {
            if (deviceIds.length > 0 && onAddToGroup) {
                await onAddToGroup(selectedGroup.id, deviceIds, 'devices')
            }
            if (personIds.length > 0 && onAddToGroup) {
                await onAddToGroup(selectedGroup.id, personIds, 'people')
            }
            setSelectedUngroupedIds(new Set())
        } catch (error) {
            console.error('Error adding to group:', error)
        }
    }

    // Get the count label for a group based on filter mode
    const getGroupCountLabel = (group: Group) => {
        const deviceCount = group.deviceIds.length
        const personCount = group.personIds?.length || 0
        
        if (filterMode === 'devices') return `${deviceCount} device${deviceCount !== 1 ? 's' : ''}`
        if (filterMode === 'people') return `${personCount} ${personCount !== 1 ? 'people' : 'person'}`
        
        const parts = []
        if (deviceCount > 0) parts.push(`${deviceCount} device${deviceCount !== 1 ? 's' : ''}`)
        if (personCount > 0) parts.push(`${personCount} ${personCount !== 1 ? 'people' : 'person'}`)
        return parts.join(', ') || '0 items'
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-3 md:p-4 border-b border-[var(--color-border-subtle)] flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base md:text-lg font-semibold text-[var(--color-text)]">
                        Groups
                    </h3>
                    {filteredGroups.length > 0 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSelectAll}
                                className="p-1.5 rounded-lg hover:bg-[var(--color-surface-subtle)] transition-colors"
                                title={allSelected ? "Deselect all" : "Select all"}
                            >
                                {allSelected ? <CheckSquare size={16} className="text-[var(--color-primary)]" /> : <Square size={16} className="text-[var(--color-text-muted)]" />}
                            </button>
                            {selectedGroupIds.size > 0 && (
                                <button
                                    onClick={() => setIsBulkDeleteModalOpen(true)}
                                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-subtle)] transition-colors text-[var(--color-danger)]"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Group Details / Edit */}
            {selectedGroup && (
                <div className="p-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/30 flex-shrink-0">
                    {isEditing ? (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-[var(--color-text)]">Edit Group</h3>
                                <div className="flex gap-1">
                                    <button onClick={handleSaveEdit} className="p-1.5 rounded hover:bg-[var(--color-surface-subtle)] text-[var(--color-success)]"><Save size={16} /></button>
                                    <button onClick={handleCancelEdit} className="p-1.5 rounded hover:bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]"><X size={16} /></button>
                                </div>
                            </div>
                            <input
                                className="w-full p-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm"
                                value={editFormData.name}
                                onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                placeholder="Group Name"
                            />
                            <textarea
                                className="w-full p-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm resize-none"
                                value={editFormData.description}
                                onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                placeholder="Description"
                                rows={2}
                            />
                            <div className="flex gap-2 flex-wrap">
                                {GROUP_COLORS.map(c => (
                                    <button
                                        key={c}
                                        className={`w-6 h-6 rounded-full border-2 transition-all ${editFormData.color === c ? 'border-[var(--color-text)] scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setEditFormData({ ...editFormData, color: c })}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${selectedGroup.color}20` }}>
                                        <Users size={20} style={{ color: selectedGroup.color }} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[var(--color-text)]">{selectedGroup.name}</h3>
                                        <p className="text-xs text-[var(--color-text-muted)]">{getGroupCountLabel(selectedGroup)}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={handleStartEdit} className="p-1.5 hover:bg-[var(--color-surface-subtle)] rounded"><Edit2 size={14} className="text-[var(--color-text-muted)]" /></button>
                                    <button onClick={() => setIsDeleteModalOpen(true)} className="p-1.5 hover:bg-[var(--color-surface-subtle)] rounded text-[var(--color-danger)]"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            {selectedGroup.description && <p className="text-sm text-[var(--color-text-soft)] mt-2">{selectedGroup.description}</p>}
                        </div>
                    )}
                </div>
            )}

            {/* Groups List - Top Half */}
            <div className="flex-1 min-h-0 overflow-auto p-2 border-b border-[var(--color-border-subtle)]">
                {filteredGroups.length === 0 ? (
                    <PanelEmptyState icon={Users} title="No Groups" description="Create a group to organize items." />
                ) : (
                    <div className="space-y-2">
                        {filteredGroups.map(group => (
                            <div
                                key={group.id}
                                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${selectedGroupId === group.id ? 'bg-[var(--color-primary-soft)] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]/50'}`}
                                onClick={() => onGroupSelect(group.id === selectedGroupId ? null : group.id)}
                            >
                                <div className="flex items-center gap-2">
                                    <button
                                        className="p-1"
                                        onClick={(e) => { e.stopPropagation(); handleToggleGroupSelection(group.id); }}
                                    >
                                        {selectedGroupIds.has(group.id) ? <CheckSquare size={16} className="text-[var(--color-primary)]" /> : <Square size={16} className="text-[var(--color-text-muted)]" />}
                                    </button>
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                                    <span className="font-medium text-sm text-[var(--color-text)]">{group.name}</span>
                                </div>
                                <span className="text-xs text-[var(--color-text-muted)]">{getGroupCountLabel(group)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Ungrouped Items - Bottom Half */}
            <div className="flex-1 min-h-0 flex flex-col">
                <div className="p-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/50 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={14} className="text-[var(--color-warning)]" />
                            <h4 className="text-sm font-semibold text-[var(--color-text)]">Ungrouped</h4>
                        </div>
                        {selectedGroup && selectedUngroupedIds.size > 0 && (
                            <Button
                                onClick={handleAddSelectedToGroup}
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                            >
                                <Plus size={12} /> Add to {selectedGroup.name}
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {filterMode === 'devices' && `${ungroupedDevices.length} device${ungroupedDevices.length !== 1 ? 's' : ''}`}
                        {filterMode === 'people' && `${ungroupedPeople.length} ${ungroupedPeople.length !== 1 ? 'people' : 'person'}`}
                        {filterMode === 'both' && `${ungroupedDevices.length} device${ungroupedDevices.length !== 1 ? 's' : ''}, ${ungroupedPeople.length} ${ungroupedPeople.length !== 1 ? 'people' : 'person'}`}
                    </p>
                </div>
                <div className="flex-1 overflow-auto p-2">
                    {/* Ungrouped Devices */}
                    {(filterMode === 'devices' || filterMode === 'both') && ungroupedDevices.length > 0 && (
                        <div className={filterMode === 'both' ? 'mb-3' : ''}>
                            {filterMode === 'both' && (
                                <div className="flex items-center gap-1.5 mb-2 px-1">
                                    <Monitor size={12} className="text-[var(--color-text-muted)]" />
                                    <span className="text-xs font-medium text-[var(--color-text-muted)]">Devices</span>
                                </div>
                            )}
                            <div className="space-y-1">
                                {ungroupedDevices.slice(0, 20).map(device => {
                                    const handleDragStart = (e: React.DragEvent) => {
                                        e.dataTransfer.effectAllowed = 'move'
                                        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'device', itemId: device.id, fromGroupId: null }))
                                    }
                                    return (
                                        <div
                                            key={device.id}
                                            draggable
                                            onDragStart={handleDragStart}
                                            onClick={() => handleToggleUngrouped(device.id)}
                                            className={`p-2 rounded-lg border cursor-move flex items-center gap-2 text-sm transition-all ${selectedUngroupedIds.has(device.id) ? 'bg-[var(--color-primary-soft)]/50 border-[var(--color-primary)]/50' : 'bg-[var(--color-surface)] border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]/30'}`}
                                        >
                                            {selectedUngroupedIds.has(device.id) ? <CheckSquare size={14} className="text-[var(--color-primary)]" /> : <Square size={14} className="text-[var(--color-text-muted)]" />}
                                            <Monitor size={14} className="text-[var(--color-text-muted)]" />
                                            <span className="text-[var(--color-text)] truncate">{device.deviceId || device.serialNumber}</span>
                                        </div>
                                    )
                                })}
                                {ungroupedDevices.length > 20 && (
                                    <p className="text-xs text-[var(--color-text-muted)] text-center py-2">+{ungroupedDevices.length - 20} more</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Ungrouped People */}
                    {(filterMode === 'people' || filterMode === 'both') && ungroupedPeople.length > 0 && (
                        <div>
                            {filterMode === 'both' && (
                                <div className="flex items-center gap-1.5 mb-2 px-1">
                                    <Users size={12} className="text-[var(--color-text-muted)]" />
                                    <span className="text-xs font-medium text-[var(--color-text-muted)]">People</span>
                                </div>
                            )}
                            <div className="space-y-1">
                                {ungroupedPeople.slice(0, 20).map(person => {
                                    const handleDragStart = (e: React.DragEvent) => {
                                        e.dataTransfer.effectAllowed = 'move'
                                        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'person', itemId: person.id, fromGroupId: null }))
                                    }
                                    return (
                                        <div
                                            key={person.id}
                                            draggable
                                            onDragStart={handleDragStart}
                                            onClick={() => handleToggleUngrouped(person.id)}
                                            className={`p-2 rounded-lg border cursor-move flex items-center gap-2 text-sm transition-all ${selectedUngroupedIds.has(person.id) ? 'bg-[var(--color-primary-soft)]/50 border-[var(--color-primary)]/50' : 'bg-[var(--color-surface)] border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]/30'}`}
                                        >
                                            {selectedUngroupedIds.has(person.id) ? <CheckSquare size={14} className="text-[var(--color-primary)]" /> : <Square size={14} className="text-[var(--color-text-muted)]" />}
                                            <Users size={14} className="text-[var(--color-text-muted)]" />
                                            <span className="text-[var(--color-text)] truncate">{person.firstName} {person.lastName}</span>
                                        </div>
                                    )
                                })}
                                {ungroupedPeople.length > 20 && (
                                    <p className="text-xs text-[var(--color-text-muted)] text-center py-2">+{ungroupedPeople.length - 20} more</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Empty state for ungrouped */}
                    {((filterMode === 'devices' && ungroupedDevices.length === 0) ||
                      (filterMode === 'people' && ungroupedPeople.length === 0) ||
                      (filterMode === 'both' && ungroupedDevices.length === 0 && ungroupedPeople.length === 0)) && (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                            <CheckSquare size={24} className="text-[var(--color-success)] mb-2" />
                            <p className="text-sm text-[var(--color-text-muted)]">All items are grouped!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-3 md:p-4 border-t border-[var(--color-border-subtle)] flex-shrink-0">
                <Button onClick={onCreateGroup} className="w-full flex items-center justify-center gap-2" variant="primary">
                    <Plus size={16} /> Create Group
                </Button>
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Group"
                message={`Are you sure you want to delete ${selectedGroup?.name}?`}
                variant="danger"
                confirmLabel="Delete"
            />
            <ConfirmationModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={handleConfirmBulkDelete}
                title="Delete Groups"
                message={`Delete ${selectedGroupIds.size} groups?`}
                variant="danger"
                confirmLabel="Delete"
            />
        </div>
    )
}

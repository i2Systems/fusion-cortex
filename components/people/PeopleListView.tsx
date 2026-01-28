'use client'

import { useMemo, useState } from 'react'
import { User, Mail, Shield, CheckSquare, Square, Trash2, Plus } from 'lucide-react'
import { Person } from '@/lib/stores/personStore'
import { Button } from '@/components/ui/Button'
import { ConfirmationModal } from '@/components/shared/ConfirmationModal'

interface PeopleListViewProps {
    people: Person[]
    selectedPersonId: string | null
    onPersonSelect: (personId: string | null) => void
    searchQuery: string
    onCreatePerson: () => void
    onDeletePeople: (personIds: string[]) => void
}

export function PeopleListView({ 
    people, 
    selectedPersonId, 
    onPersonSelect, 
    searchQuery,
    onCreatePerson,
    onDeletePeople
}: PeopleListViewProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)

    const filteredPeople = useMemo(() => {
        if (!searchQuery) return people
        const lowerQuery = searchQuery.toLowerCase()
        return people.filter(p =>
            p.firstName.toLowerCase().includes(lowerQuery) ||
            p.lastName.toLowerCase().includes(lowerQuery) ||
            p.email?.toLowerCase().includes(lowerQuery) ||
            p.role?.toLowerCase().includes(lowerQuery)
        )
    }, [people, searchQuery])

    const allSelected = filteredPeople.length > 0 && selectedIds.size === filteredPeople.length

    const handleToggleSelect = (e: React.MouseEvent, personId: string) => {
        e.stopPropagation()
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(personId)) next.delete(personId)
            else next.add(personId)
            return next
        })
    }

    const handleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredPeople.map(p => p.id)))
        }
    }

    const handleConfirmBulkDelete = () => {
        onDeletePeople(Array.from(selectedIds))
        setSelectedIds(new Set())
        setIsBulkDeleteModalOpen(false)
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header with actions */}
            <div className="p-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {filteredPeople.length > 0 && (
                        <button
                            onClick={handleSelectAll}
                            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-subtle)] transition-colors"
                            title={allSelected ? "Deselect all" : "Select all"}
                        >
                            {allSelected ? (
                                <CheckSquare size={18} className="text-[var(--color-primary)]" />
                            ) : (
                                <Square size={18} className="text-[var(--color-text-muted)]" />
                            )}
                        </button>
                    )}
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        All People ({filteredPeople.length})
                    </h2>
                    {selectedIds.size > 0 && (
                        <span className="text-sm text-[var(--color-text-muted)]">
                            • {selectedIds.size} selected
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <Button
                            onClick={() => setIsBulkDeleteModalOpen(true)}
                            variant="danger"
                            className="flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Delete ({selectedIds.size})
                        </Button>
                    )}
                    <Button
                        onClick={onCreatePerson}
                        variant="primary"
                        className="flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Add Person
                    </Button>
                </div>
            </div>

            {/* Grid of people */}
            <div className="flex-1 overflow-auto p-4">
                {filteredPeople.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
                        <User size={48} className="mb-4 opacity-50" />
                        <p className="mb-4">No people found</p>
                        <Button onClick={onCreatePerson} variant="primary" className="flex items-center gap-2">
                            <Plus size={16} />
                            Add Person
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPeople.map(person => (
                            <div
                                key={person.id}
                                onClick={() => onPersonSelect(person.id)}
                                className={`
                                    p-4 rounded-xl border cursor-pointer transition-all hover:shadow-[var(--shadow-elevated)] flex flex-col gap-3 relative
                                    ${selectedPersonId === person.id
                                        ? 'bg-[var(--color-primary-soft)] border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                                        : selectedIds.has(person.id)
                                            ? 'bg-[var(--color-surface-subtle)] border-[var(--color-primary)]/50'
                                            : 'bg-[var(--color-surface)] border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]/50'
                                    }
                                `}
                            >
                                {/* Checkbox */}
                                <button
                                    onClick={(e) => handleToggleSelect(e, person.id)}
                                    className="absolute top-3 right-3 p-1 rounded hover:bg-[var(--color-surface-subtle)] transition-colors"
                                >
                                    {selectedIds.has(person.id) ? (
                                        <CheckSquare size={18} className="text-[var(--color-primary)]" />
                                    ) : (
                                        <Square size={18} className="text-[var(--color-text-muted)]" />
                                    )}
                                </button>

                                <div className="flex items-center gap-3 pr-8">
                                    <div className="relative w-10 h-10 rounded-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {person.imageUrl ? (
                                            <img 
                                                src={person.imageUrl} 
                                                alt={`${person.firstName} ${person.lastName}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User size={20} className="text-[var(--color-text-muted)]" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-[var(--color-text)] truncate">
                                            {person.firstName} {person.lastName}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                                            <Shield size={12} />
                                            <span>{person.role || 'No Role'}</span>
                                        </div>
                                    </div>
                                </div>

                                {person.email && (
                                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-soft)] px-2 py-1.5 rounded-md bg-[var(--color-surface-subtle)]/50">
                                        <Mail size={14} className="flex-shrink-0" />
                                        <span className="truncate">{person.email}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mt-auto pt-2 border-t border-[var(--color-border-subtle)]">
                                    <span>Added {person.createdAt?.toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={handleConfirmBulkDelete}
                title="Delete People"
                message={`Are you sure you want to delete ${selectedIds.size} ${selectedIds.size === 1 ? 'person' : 'people'}? This action cannot be undone.`}
                variant="danger"
                confirmLabel="Delete"
            />
        </div>
    )
}

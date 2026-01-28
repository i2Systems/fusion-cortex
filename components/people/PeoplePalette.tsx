/**
 * People Palette Component
 * 
 * Floating palette for managing people on the map
 * Matches the DevicePalette design pattern
 */

'use client'

import { useState } from 'react'
import { User, Plus, Menu } from 'lucide-react'
import { Person } from '@/lib/stores/personStore'

interface PeoplePaletteProps {
    people: Person[]
    selectedPersonIds: string[]
    onSelectionChange: (ids: string[]) => void
    onDragStart: (e: React.DragEvent, personIds: string[]) => void
    onAdd: () => void
}

export function PeoplePalette({
    people,
    selectedPersonIds,
    onSelectionChange,
    onDragStart,
    onAdd
}: PeoplePaletteProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)

    // Filter people without coordinates (similar to devices without positions)
    const peopleWithoutCoords = people.filter(p => !p.x || !p.y || p.x === null || p.y === null)

    const handlePersonClick = (e: React.MouseEvent, personId: string) => {
        e.stopPropagation()
        if (e.metaKey || e.ctrlKey) {
            if (selectedPersonIds.includes(personId)) {
                onSelectionChange(selectedPersonIds.filter(id => id !== personId))
            } else {
                onSelectionChange([...selectedPersonIds, personId])
            }
        } else {
            onSelectionChange([personId])
        }
    }

    return (
        <div
            className={`
                absolute top-24 left-4 z-10 
                flex flex-col bg-[var(--color-surface-glass)] backdrop-blur-xl border border-[var(--color-border-subtle)] rounded-xl shadow-2xl overflow-hidden 
                transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-top-left
                ${isCollapsed ? 'w-[42px] h-[42px]' : 'w-64 max-h-[60vh]'}
            `}
            onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
            }}
            onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
            }}
        >
            {/* Header */}
            <div className={`
                flex items-center justify-between bg-[var(--color-surface-hover)]
                transition-all duration-300
                ${isCollapsed ? 'p-0 bg-transparent' : 'p-3 border-b border-[var(--color-border)]'}
            `}>
                <div className="flex items-center gap-2 relative z-20">
                    <div
                        className={`
                            flex items-center justify-center rounded-md cursor-pointer transition-all duration-300
                            ${isCollapsed ? 'w-[40px] h-[40px] bg-transparent hover:bg-[var(--color-surface-hover)]' : 'p-1.5'}
                        `}
                        style={!isCollapsed ? {
                            backgroundColor: 'var(--color-primary-soft)'
                        } : undefined}
                        onMouseEnter={(e) => {
                            if (!isCollapsed) {
                                e.currentTarget.style.backgroundColor = 'var(--color-primary-soft)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isCollapsed) {
                                e.currentTarget.style.backgroundColor = 'var(--color-primary-soft)'
                            }
                        }}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Show People" : "Hide Palette"}
                    >
                        <User
                            size={isCollapsed ? 18 : 14}
                            className={`transition-all duration-300 ${isCollapsed ? 'scale-110' : ''}`}
                            style={{ color: 'var(--color-primary)' }}
                        />
                    </div>

                    {/* Title & Count - Fade out when collapsed */}
                    <div className={`
                        transition-all duration-200 origin-left whitespace-nowrap
                        ${isCollapsed ? 'opacity-0 w-0 scale-95 pointer-events-none' : 'opacity-100 w-auto scale-100'}
                    `}>
                        <h3 className="text-xs font-semibold text-[var(--color-text)] leading-tight">New People</h3>
                        <p className="text-[10px] text-[var(--color-text-muted)]">{peopleWithoutCoords.length} waiting</p>
                    </div>
                </div>

                {/* Right Side Controls - Fade out */}
                <div className={`
                    flex items-center gap-1
                    transition-all duration-200 origin-right
                    ${isCollapsed ? 'opacity-0 w-0 scale-95 pointer-events-none translate-x-4' : 'opacity-100 w-auto scale-100 translate-x-0'}
                `}>
                    <button
                        onClick={onAdd}
                        className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
                        title="Add Person"
                    >
                        <Plus size={14} />
                    </button>

                    <button
                        className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
                        title="Menu"
                    >
                        <Menu size={14} />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className={`
                overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--color-border)] scrollbar-track-transparent
                transition-all duration-300 origin-top
                ${isCollapsed ? 'opacity-0 h-0 p-0 pointer-events-none' : 'opacity-100 p-2 h-auto'}
                ${peopleWithoutCoords.length === 0 && !isCollapsed ? 'h-32 flex items-center justify-center' : ''}
            `}>
                {peopleWithoutCoords.length === 0 ? (
                    <div className="text-center p-4">
                        <div
                            className="w-10 h-10 rounded-full bg-[var(--color-surface-subtle)] flex items-center justify-center mx-auto mb-2 cursor-pointer hover:bg-[var(--color-primary)]/10 transition-colors"
                            onClick={onAdd}
                        >
                            <Plus size={18} className="text-[var(--color-text-muted)]" />
                        </div>
                        <p className="text-[10px] text-[var(--color-text-muted)]">No new people</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {peopleWithoutCoords.map((person) => {
                            const isSelected = selectedPersonIds.includes(person.id)
                            return (
                                <div
                                    key={person.id}
                                    draggable
                                    onDragStart={(e) => {
                                        e.stopPropagation()
                                        let idsToDrag = selectedPersonIds
                                        if (!selectedPersonIds.includes(person.id)) {
                                            idsToDrag = [person.id]
                                            onSelectionChange([person.id])
                                        }
                                        const data = JSON.stringify(idsToDrag)
                                        e.dataTransfer.setData('application/json', data)
                                        e.dataTransfer.effectAllowed = 'copyMove'
                                        onDragStart(e, idsToDrag)
                                        const element = e.currentTarget as HTMLElement
                                        element.style.opacity = '0.5'
                                        console.log('Dragging people:', idsToDrag, 'Data:', data)
                                    }}
                                    onDragEnd={(e) => {
                                        const element = e.currentTarget as HTMLElement
                                        element.style.opacity = '1'
                                    }}
                                    onClick={(e) => handlePersonClick(e, person.id)}
                                    className={`
                                        relative group cursor-grab
                                        border rounded-lg select-none
                                        flex items-center gap-2 p-2 mb-0.5
                                        transition-[transform,box-shadow,background-color,border-color,opacity]
                                        ${isSelected
                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                                            : 'bg-[var(--color-surface)] border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface-hover)]'
                                        }
                                    `}
                                    style={isSelected ? {
                                        boxShadow: '0 0 10px var(--color-primary-soft)'
                                    } : {}}
                                >
                                    <div className="relative w-6 h-6 rounded-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {person.imageUrl ? (
                                            <img
                                                src={person.imageUrl}
                                                alt={`${person.firstName} ${person.lastName}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User size={12} className="text-[var(--color-text-muted)]" />
                                        )}
                                    </div>

                                    <div className="text-left overflow-hidden flex-1 min-w-0">
                                        <div className="text-[9px] font-medium text-[var(--color-text)] truncate">
                                            {person.firstName} {person.lastName}
                                        </div>
                                        {person.role && (
                                            <div className="text-[8px] text-[var(--color-text-muted)] truncate">
                                                {person.role}
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className={`w-3 h-3 rounded-full border border-current flex items-center justify-center transition-opacity ${isSelected ? 'opacity-100' : 'text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100'}`}
                                        style={isSelected ? { color: 'var(--color-primary)' } : undefined}
                                    >
                                        {isSelected && (
                                            <div
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{ backgroundColor: 'var(--color-primary)' }}
                                            />
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

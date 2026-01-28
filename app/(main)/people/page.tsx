'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { SearchIsland } from '@/components/layout/SearchIsland'
import { ResizablePanel } from '@/components/layout/ResizablePanel'
import { PeopleListView } from '@/components/people/PeopleListView'
import { PeoplePanel } from '@/components/people/PeoplePanel'
import { PeopleViewToggle, type PeopleViewMode } from '@/components/people/PeopleViewToggle'
import { PeoplePalette } from '@/components/people/PeoplePalette'
import { PeopleToolbar, type PeopleToolMode } from '@/components/people/PeopleToolbar'
import { usePeople } from '@/lib/hooks/usePeople'
import { useSite } from '@/lib/SiteContext'
import { useToast } from '@/lib/ToastContext'
import { trpc } from '@/lib/trpc/client'
import dynamic from 'next/dynamic'

// Dynamically import PeopleMapCanvas to avoid SSR issues
const PeopleMapCanvasDynamic = dynamic(() => import('@/components/people/PeopleMapCanvas').then(mod => ({ default: mod.PeopleMapCanvas })), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-[var(--color-text-muted)]">Loading map...</div>
    </div>
  ),
})

export default function PeoplePage() {
    const { people, addPerson, updatePerson, deletePerson, fetchPeople } = usePeople()
    const { activeSiteId } = useSite()
    const { addToast } = useToast()

    const [viewMode, setViewMode] = useState<PeopleViewMode>('grid')
    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
    const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [toolMode, setToolMode] = useState<PeopleToolMode>('select')
    const [currentLocationId, setCurrentLocationId] = useState<string | null>(null)
    const [mapImageUrl, setMapImageUrl] = useState<string | null>(null)
    const [vectorData, setVectorData] = useState<any>(null)
    const [imageBounds, setImageBounds] = useState<any>(null)
    const [mapScale, setMapScale] = useState(1)
    const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 })
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    // Fetch locations
    const utils = trpc.useContext()
    const { data: locations = [] } = trpc.location.list.useQuery(
        { siteId: activeSiteId || '' },
        { enabled: !!activeSiteId }
    )

    const currentLocation = useMemo(() => {
        if (locations.length > 0 && !currentLocationId) {
            return locations[0]
        }
        return locations.find((loc: any) => loc.id === currentLocationId) || null
    }, [locations, currentLocationId])

    // Auto-select first location
    useEffect(() => {
        if (locations.length > 0 && !currentLocationId) {
            const defaultLocation = locations.find((l: any) => l.type === 'base') || locations[0]
            setCurrentLocationId(defaultLocation.id)
        }
    }, [locations, currentLocationId])

    // Load location data
    useEffect(() => {
        const loadLocationData = async () => {
            if (!currentLocation) {
                setMapImageUrl(null)
                setVectorData(null)
                return
            }

            if (currentLocation.vectorDataUrl) {
                try {
                    const res = await fetch(currentLocation.vectorDataUrl)
                    if (res.ok) {
                        const data = await res.json()
                        setVectorData(data)
                    }
                } catch (e) {
                    console.error('Failed to load vector data:', e)
                }
            } else {
                setVectorData(null)
            }

            if (currentLocation.imageUrl) {
                setMapImageUrl(currentLocation.imageUrl)
            } else {
                setMapImageUrl(null)
            }
        }
        loadLocationData()
    }, [currentLocation])

    const mapUploaded = !!currentLocation

    // Fetch people when site changes
    useEffect(() => {
        if (activeSiteId) {
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
            setSelectedPersonId(null)
        }
    }

    const handleCreatePerson = async () => {
        if (!activeSiteId) {
            addToast({ type: 'error', title: 'Error', message: 'No site selected' })
            return
        }

        try {
            const newPerson = await addPerson({
                firstName: 'New',
                lastName: 'Person',
                email: '',
                role: 'User',
                siteId: activeSiteId,
            })
            setSelectedPersonId(newPerson.id)
            addToast({ type: 'success', title: 'Person Created', message: 'New person created successfully' })
        } catch (error) {
            console.error('Failed to create person:', error)
            addToast({ type: 'error', title: 'Error', message: 'Failed to create person' })
        }
    }

    const handleDeletePerson = async (personId: string) => {
        try {
            await deletePerson(personId)
            if (selectedPersonId === personId) {
                setSelectedPersonId(null)
            }
            addToast({ type: 'success', title: 'Person Deleted', message: 'Person deleted successfully' })
        } catch (error) {
            console.error('Failed to delete person:', error)
            addToast({ type: 'error', title: 'Error', message: 'Failed to delete person' })
        }
    }

    const handleDeletePeople = async (personIds: string[]) => {
        try {
            await Promise.all(personIds.map(id => deletePerson(id)))
            if (selectedPersonId && personIds.includes(selectedPersonId)) {
                setSelectedPersonId(null)
            }
            setSelectedPersonIds([])
            addToast({ type: 'success', title: 'People Deleted', message: `${personIds.length} people deleted successfully` })
        } catch (error) {
            console.error('Failed to delete people:', error)
            addToast({ type: 'error', title: 'Error', message: 'Failed to delete people' })
        }
    }

    // Handle person move on map
    const handlePersonMove = useCallback(async (personId: string, x: number, y: number) => {
        const person = people.find(p => p.id === personId)
        if (!person) return

        try {
            await updatePerson({
                id: personId,
                x,
                y,
            })
        } catch (error) {
            console.error('Failed to update person position:', error)
        }
    }, [people, updatePerson])

    const handlePersonMoveEnd = useCallback(async (personId: string, x: number, y: number) => {
        await handlePersonMove(personId, x, y)
    }, [handlePersonMove])

    // Handle palette drag (now handled directly in PeoplePalette)
    const handlePaletteDragStart = useCallback((e: React.DragEvent, personIds: string[]) => {
        // This is just a placeholder - actual drag handling is in PeoplePalette
    }, [])

    // Handle map drop
    const handleMapDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            // Get dragged person IDs (using application/json like DevicePalette)
            const json = e.dataTransfer.getData('application/json')
            if (!json) {
                console.warn('No drag data found')
                return
            }

            const personIds = JSON.parse(json) as string[]
            if (!Array.isArray(personIds) || personIds.length === 0) {
                console.warn('Invalid person IDs:', personIds)
                return
            }

            // Calculate drop coordinates
            // The event gives clientX/Y. We need to convert to map coordinates (normalized 0-1).
            const mapContainer = e.currentTarget.getBoundingClientRect()
            const dropX = e.clientX - mapContainer.left
            const dropY = e.clientY - mapContainer.top

            // Convert to Stage coordinates: (Mouse - StagePos) / Scale
            // Account for stage position and scale
            const stageX = (dropX - (mapPosition.x || 0)) / (mapScale || 1)
            const stageY = (dropY - (mapPosition.y || 0)) / (mapScale || 1)

            let finalX = 0
            let finalY = 0

            if (imageBounds && imageBounds.width > 0 && imageBounds.height > 0) {
                // Use effective image bounds for coordinate conversion
                // normalizedX = (canvasX - imageX) / imageWidth
                finalX = (stageX - imageBounds.x) / imageBounds.width
                finalY = (stageY - imageBounds.y) / imageBounds.height
            } else {
                // Fallback: use container dimensions
                finalX = stageX / mapContainer.width
                finalY = stageY / mapContainer.height
            }

            // Clamp 0-1
            finalX = Math.max(0.01, Math.min(0.99, finalX))
            finalY = Math.max(0.01, Math.min(0.99, finalY))

            // Update each person's position with small offset for multiple people
            const offset = 0.02
            for (let i = 0; i < personIds.length; i++) {
                const personId = personIds[i]
                const person = people.find(p => p.id === personId)
                if (person) {
                    // Add small offset for multiple people
                    const offsetX = i * offset
                    const offsetY = 0
                    await handlePersonMove(personId, finalX + offsetX, finalY + offsetY)
                } else {
                    console.warn(`Person ${personId} not found`)
                }
            }

            if (personIds.length > 0) {
                const firstPerson = people.find(p => p.id === personIds[0])
                if (firstPerson) {
                    const personText = personIds.length > 1 ? 'people' : 'person'
                    const count = personIds.length
                    const message = count + ' ' + personText + ' placed on map'
                    addToast({ 
                        type: 'success', 
                        title: 'People Placed', 
                        message: message
                    })
                }
            }
        } catch (error) {
            console.error('Failed to handle drop:', error)
            addToast({ 
                type: 'error', 
                title: 'Drop Failed', 
                message: 'Failed to place person on map' 
            })
        }
    }, [people, handlePersonMove, mapPosition, mapScale, imageBounds, addToast])

    // Filter people by search
    const filteredPeople = useMemo(() => {
        if (!searchQuery) return people
        const lowerQuery = searchQuery.toLowerCase()
        return people.filter((p) => {
            const firstNameMatch = p.firstName.toLowerCase().includes(lowerQuery)
            const lastNameMatch = p.lastName.toLowerCase().includes(lowerQuery)
            const emailMatch = p.email?.toLowerCase().includes(lowerQuery) || false
            const roleMatch = p.role?.toLowerCase().includes(lowerQuery) || false
            return firstNameMatch || lastNameMatch || emailMatch || roleMatch
        })
    }, [people, searchQuery])

    return (
        <div className="h-full flex flex-col min-h-0 overflow-hidden">
            {/* Top Search Island */}
            <div className="flex-shrink-0 page-padding-x pt-3 md:pt-4 pb-2 md:pb-3 relative">
                <SearchIsland
                    position="top"
                    fullWidth={true}
                    showActions={true}
                    title="People"
                    subtitle="Manage users and personnel"
                    placeholder="Search people..."
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    onActionDetected={(action) => {
                        if (action.id === 'create-person') {
                            handleCreatePerson()
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
                {viewMode === 'grid' ? (
                    <>
                        {/* Grid View - Left Side */}
                        <div
                            ref={mapContainerRef}
                            className="flex-1 min-w-0 flex flex-col"
                        >
                            {/* View Toggle - Top of main content */}
                            <div className="mb-2 md:mb-3 flex items-center justify-between">
                                <PeopleViewToggle currentView={viewMode} onViewChange={setViewMode} />
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 min-h-0 relative rounded-2xl shadow-[var(--shadow-strong)] border border-[var(--color-border-subtle)] overflow-hidden bg-[var(--color-surface)]">
                                <PeopleListView
                                    people={filteredPeople}
                                    selectedPersonId={selectedPersonId}
                                    onPersonSelect={setSelectedPersonId}
                                    searchQuery={searchQuery}
                                    onCreatePerson={handleCreatePerson}
                                    onDeletePeople={handleDeletePeople}
                                />
                            </div>
                        </div>

                        {/* People Panel - Right Side */}
                        <div ref={panelRef}>
                            <ResizablePanel
                                defaultWidth={384}
                                minWidth={320}
                                maxWidth={512}
                                collapseThreshold={200}
                                storageKey="people_panel"
                            >
                                <PeoplePanel
                                    people={people}
                                    selectedPersonId={selectedPersonId}
                                    onPersonSelect={setSelectedPersonId}
                                    onCreatePerson={handleCreatePerson}
                                    onDeletePerson={handleDeletePerson}
                                    onDeletePeople={handleDeletePeople}
                                    onEditPerson={async (personId, updates) => {
                                        try {
                                            const { id, createdAt, updatedAt, siteId, email, role } = updates as any

                                            await updatePerson({
                                                id: personId,
                                                firstName: updates.firstName,
                                                lastName: updates.lastName,
                                                email: email === null ? undefined : email,
                                                role: role === null ? undefined : role,
                                                x: updates.x ?? undefined,
                                                y: updates.y ?? undefined,
                                            })
                                            addToast({ type: 'success', title: 'Person Updated', message: 'Person updated successfully' })
                                        } catch (e) {
                                            console.error(e)
                                            addToast({ type: 'error', title: 'Error', message: 'Failed to update person' })
                                        }
                                    }}
                                />
                            </ResizablePanel>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Map View */}
                        <div
                            ref={mapContainerRef}
                            className="flex-1 min-w-0 flex flex-col"
                        >
                            {/* View Toggle - Top of main content */}
                            <div className="mb-2 md:mb-3 flex items-center justify-between">
                                <PeopleViewToggle currentView={viewMode} onViewChange={setViewMode} />
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 min-h-0 relative rounded-2xl shadow-[var(--shadow-strong)] border border-[var(--color-border-subtle)]" style={{ overflow: 'visible', minHeight: 0 }}>
                                {/* Toolbar - Top center */}
                                {mapUploaded && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none" style={{ transform: 'translateX(-50%) translateY(-50%)' }}>
                                        <PeopleToolbar
                                            mode={toolMode}
                                            onModeChange={setToolMode}
                                            selectedCount={selectedPersonIds.length || (selectedPersonId ? 1 : 0)}
                                        />
                                    </div>
                                )}

                                {/* Map Canvas */}
                                <div className="w-full h-full rounded-2xl overflow-hidden bg-[var(--color-bg-elevated)] relative">
                                {!mapUploaded ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-center text-[var(--color-text-muted)]">
                                            <p className="mb-2">No map uploaded</p>
                                            <p className="text-sm">Upload a map in Locations & Devices to place people</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="w-full h-full"
                                        onDragOver={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            e.dataTransfer.dropEffect = 'move'
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handleMapDrop(e)
                                        }}
                                    >
                                        <PeopleMapCanvasDynamic
                                            onPersonSelect={(id) => {
                                                setSelectedPersonId(id)
                                                if (id) {
                                                    setSelectedPersonIds([id])
                                                }
                                            }}
                                            selectedPersonId={selectedPersonId}
                                            mapImageUrl={mapImageUrl}
                                            vectorData={vectorData}
                                            people={filteredPeople}
                                            mode={toolMode}
                                            onPersonMove={handlePersonMove}
                                            onPersonMoveEnd={handlePersonMoveEnd}
                                            currentLocation={currentLocation ? {
                                                id: currentLocation.id,
                                                name: currentLocation.name,
                                                type: (currentLocation.type === 'base' || currentLocation.type === 'zoom' ? currentLocation.type : 'base') as 'base' | 'zoom',
                                                parentLocationId: currentLocation.parentId || undefined,
                                                imageUrl: currentLocation.imageUrl || undefined,
                                                vectorData: null,
                                                zoomBounds: typeof currentLocation.zoomBounds === 'object' &&
                                                    currentLocation.zoomBounds !== null &&
                                                    'minX' in currentLocation.zoomBounds &&
                                                    'minY' in currentLocation.zoomBounds &&
                                                    'maxX' in currentLocation.zoomBounds &&
                                                    'maxY' in currentLocation.zoomBounds
                                                    ? currentLocation.zoomBounds as { minX: number; minY: number; maxX: number; maxY: number }
                                                    : undefined,
                                                createdAt: typeof currentLocation.createdAt === 'string'
                                                    ? new Date(currentLocation.createdAt).getTime()
                                                    : currentLocation.createdAt instanceof Date
                                                        ? currentLocation.createdAt.getTime()
                                                        : Date.now(),
                                                updatedAt: typeof currentLocation.updatedAt === 'string'
                                                    ? new Date(currentLocation.updatedAt).getTime()
                                                    : currentLocation.updatedAt instanceof Date
                                                        ? currentLocation.updatedAt.getTime()
                                                        : Date.now(),
                                            } : null}
                                            onImageBoundsChange={setImageBounds}
                                            onScaleChange={setMapScale}
                                            onStagePositionChange={setMapPosition}
                                            externalScale={mapScale}
                                            externalStagePosition={mapPosition}
                                        />
                                    </div>
                                )}

                                {/* People Palette - Floating (inside map container) */}
                                {mapUploaded && (
                                    <PeoplePalette
                                        people={filteredPeople}
                                        selectedPersonIds={selectedPersonIds}
                                        onSelectionChange={setSelectedPersonIds}
                                        onDragStart={handlePaletteDragStart}
                                        onAdd={handleCreatePerson}
                                    />
                                )}
                            </div>
                        </div>
                        </div>

                        {/* People Panel - Right Side */}
                        <div ref={panelRef}>
                            <ResizablePanel
                                defaultWidth={384}
                                minWidth={320}
                                maxWidth={512}
                                collapseThreshold={200}
                                storageKey="people_panel"
                            >
                                <PeoplePanel
                                    people={people}
                                    selectedPersonId={selectedPersonId}
                                    onPersonSelect={setSelectedPersonId}
                                    onCreatePerson={handleCreatePerson}
                                    onDeletePerson={handleDeletePerson}
                                    onDeletePeople={handleDeletePeople}
                                    onEditPerson={async (personId, updates) => {
                                        try {
                                            const { id, createdAt, updatedAt, siteId, email, role } = updates as any

                                            await updatePerson({
                                                id: personId,
                                                firstName: updates.firstName,
                                                lastName: updates.lastName,
                                                email: email === null ? undefined : email,
                                                role: role === null ? undefined : role,
                                                x: updates.x ?? undefined,
                                                y: updates.y ?? undefined,
                                            })
                                            addToast({ type: 'success', title: 'Person Updated', message: 'Person updated successfully' })
                                        } catch (e) {
                                            console.error(e)
                                            addToast({ type: 'error', title: 'Error', message: 'Failed to update person' })
                                        }
                                    }}
                                />
                            </ResizablePanel>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

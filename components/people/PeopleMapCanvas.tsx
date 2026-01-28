/**
 * People Map Canvas Component
 * 
 * Canvas for rendering people on the map with drag-and-drop placement
 */

'use client'

import { Stage, Layer, Circle, Group, Text } from 'react-konva'
import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useZoomContext } from '@/lib/MapContext'
import { FloorPlanImage, type ImageBounds } from '@/components/map/FloorPlanImage'
import type { ExtractedVectorData } from '@/lib/pdfVectorExtractor'
import type { Location } from '@/lib/locationStorage'
import { getRgbaVariable } from '@/lib/canvasColors'
import { Person } from '@/lib/stores/personStore'

interface PeopleMapCanvasProps {
  onPersonSelect?: (personId: string | null) => void
  selectedPersonId?: string | null
  mapImageUrl?: string | null
  vectorData?: ExtractedVectorData | null
  people?: Person[]
  mode?: 'select' | 'move'
  onPersonMove?: (personId: string, x: number, y: number) => void
  onPersonMoveEnd?: (personId: string, x: number, y: number) => void
  currentLocation?: Location | null
  onImageBoundsChange?: (bounds: ImageBounds) => void
  externalScale?: number
  externalStagePosition?: { x: number; y: number }
  onScaleChange?: (scale: number) => void
  onStagePositionChange?: (position: { x: number; y: number }) => void
}

export function PeopleMapCanvas({
  onPersonSelect,
  selectedPersonId,
  mapImageUrl,
  vectorData,
  people = [],
  mode = 'select',
  onPersonMove,
  onPersonMoveEnd,
  currentLocation,
  onImageBoundsChange,
  externalScale,
  externalStagePosition,
  onScaleChange,
  onStagePositionChange,
}: PeopleMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [stagePosition, setStagePositionInternal] = useState({ x: 0, y: 0 })
  const [scale, setScaleInternal] = useState(1)
  const { setZoomLevel, triggerZoomIndicator } = useZoomContext()

  const effectiveScale = externalScale ?? scale
  const effectiveStagePosition = externalStagePosition ?? stagePosition

  const setScale = useCallback((newScale: number) => {
    setScaleInternal(newScale)
    onScaleChange?.(newScale)
    setZoomLevel(newScale)
    triggerZoomIndicator()
  }, [onScaleChange, setZoomLevel, triggerZoomIndicator])

  const setStagePosition = useCallback((newPosition: { x: number; y: number }) => {
    setStagePositionInternal(newPosition)
    onStagePositionChange?.(newPosition)
  }, [onStagePositionChange])

  const [imageBounds, setImageBounds] = useState<ImageBounds | null>(null)
  const imageBoundsRef = useRef<ImageBounds | null>(null)

  useEffect(() => {
    imageBoundsRef.current = imageBounds
  }, [imageBounds])

  const handleImageBoundsChange = useCallback((bounds: ImageBounds) => {
    setImageBounds(prev => {
      if (!prev ||
        prev.x !== bounds.x ||
        prev.y !== bounds.y ||
        prev.width !== bounds.width ||
        prev.height !== bounds.height ||
        prev.naturalWidth !== bounds.naturalWidth ||
        prev.naturalHeight !== bounds.naturalHeight) {
        return bounds
      }
      return prev
    })
    onImageBoundsChange?.(bounds)
  }, [onImageBoundsChange])

  const getEffectiveImageBounds = useCallback(() => {
    const rawBounds = imageBoundsRef.current || imageBounds
    if (!rawBounds) return null
    if (!currentLocation?.zoomBounds || !currentLocation?.type || currentLocation.type !== 'zoom') return rawBounds

    const zoomBounds = currentLocation.zoomBounds as { minX: number; minY: number; maxX: number; maxY: number }
    if (!zoomBounds || typeof zoomBounds.minX !== 'number') return rawBounds

    const cropWidth = (zoomBounds.maxX - zoomBounds.minX) * rawBounds.width
    const cropHeight = (zoomBounds.maxY - zoomBounds.minY) * rawBounds.height
    const scaleX = dimensions.width / cropWidth
    const scaleY = dimensions.height / cropHeight
    const scale = Math.min(scaleX, scaleY)
    const scaledWidth = cropWidth * scale
    const scaledHeight = cropHeight * scale
    const cropOffsetX = (dimensions.width - scaledWidth) / 2
    const cropOffsetY = (dimensions.height - scaledHeight) / 2
    const effectiveFullWidth = scaledWidth / (zoomBounds.maxX - zoomBounds.minX)
    const effectiveFullHeight = scaledHeight / (zoomBounds.maxY - zoomBounds.minY)
    const effectiveX = cropOffsetX - (zoomBounds.minX * effectiveFullWidth)
    const effectiveY = cropOffsetY - (zoomBounds.minY * effectiveFullHeight)

    return {
      x: effectiveX,
      y: effectiveY,
      width: effectiveFullWidth,
      height: effectiveFullHeight,
      naturalWidth: rawBounds.naturalWidth,
      naturalHeight: rawBounds.naturalHeight
    }
  }, [imageBounds, dimensions, currentLocation])

  const toCanvasCoords = useCallback((point: { x: number; y: number }) => {
    const bounds = getEffectiveImageBounds()
    if (bounds) {
      return {
        x: bounds.x + point.x * bounds.width,
        y: bounds.y + point.y * bounds.height,
      }
    } else {
      return {
        x: point.x * dimensions.width,
        y: point.y * dimensions.height,
      }
    }
  }, [getEffectiveImageBounds, dimensions])

  const fromCanvasCoords = useCallback((point: { x: number; y: number }) => {
    const bounds = getEffectiveImageBounds()
    if (bounds) {
      return {
        x: (point.x - bounds.x) / bounds.width,
        y: (point.y - bounds.y) / bounds.height,
      }
    } else {
      return {
        x: point.x / dimensions.width,
        y: point.y / dimensions.height,
      }
    }
  }, [getEffectiveImageBounds, dimensions])

  const [hoveredPerson, setHoveredPerson] = useState<Person | null>(null)
  const [draggedPerson, setDraggedPerson] = useState<{
    id: string
    startX: number
    startY: number
    startCanvasX: number
    startCanvasY: number
    dragX?: number
    dragY?: number
  } | null>(null)

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Filter people with coordinates
  const peopleWithCoords = useMemo(() => {
    return people.filter(p => p.x !== null && p.x !== undefined && p.y !== null && p.y !== undefined)
  }, [people])

  // Handle person drag (match devices MapCanvas: use Group position, not pointer)
  const handlePersonDragStart = useCallback((e: any, person: Person) => {
    if (mode !== 'move') return
    const personCoords = toCanvasCoords({ x: person.x!, y: person.y! })
    setDraggedPerson({
      id: person.id,
      startX: person.x!,
      startY: person.y!,
      startCanvasX: personCoords.x,
      startCanvasY: personCoords.y,
      dragX: personCoords.x,
      dragY: personCoords.y,
    })
    // Prevent stage dragging when dragging people
    e.cancelBubble = true
  }, [mode, toCanvasCoords])

  const handlePersonDrag = useCallback((e: any) => {
    if (!draggedPerson) return
    // Prevent stage dragging
    e.cancelBubble = true
    // Use Group position (canvas coords), like MapCanvas devices - not pointer (wrong when zoomed/panned)
    const pos = e.target.position()
    setDraggedPerson(prev => prev ? {
      ...prev,
      dragX: pos.x,
      dragY: pos.y,
    } : null)
  }, [draggedPerson])

  const handlePersonDragEnd = useCallback((e: any) => {
    if (!draggedPerson) return
    // Prevent stage dragging
    e.cancelBubble = true
    // Use Group position (canvas coords), like MapCanvas devices
    const pos = e.target.position()
    const normalized = fromCanvasCoords({ x: pos.x, y: pos.y })
    const clampedX = Math.max(0, Math.min(1, normalized.x))
    const clampedY = Math.max(0, Math.min(1, normalized.y))
    onPersonMoveEnd?.(draggedPerson.id, clampedX, clampedY)
    setDraggedPerson(null)
  }, [draggedPerson, fromCanvasCoords, onPersonMoveEnd])


  // Colors
  const colors = {
    primary: getRgbaVariable('--color-primary', 1),
    text: getRgbaVariable('--color-text', 1),
    muted: getRgbaVariable('--color-text-muted', 0.5),
    border: getRgbaVariable('--color-border-subtle', 0.3),
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        scaleX={effectiveScale}
        scaleY={effectiveScale}
        x={effectiveStagePosition.x}
        y={effectiveStagePosition.y}
        draggable={mode === 'select' && !draggedPerson}
        onWheel={(e) => {
          e.evt.preventDefault()
          const stage = e.target.getStage()
          if (!stage) return

          const oldScale = effectiveScale
          const pointer = stage.getPointerPosition()
          if (!pointer) return

          const mousePointTo = {
            x: (pointer.x - effectiveStagePosition.x) / oldScale,
            y: (pointer.y - effectiveStagePosition.y) / oldScale,
          }

          const scaleBy = 1.1
          const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
          const clampedScale = Math.max(0.1, Math.min(5, newScale))

          setScale(clampedScale)
          setStagePosition({
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
          })
        }}
      >
        {/* Background Layer */}
        <Layer>
          {mapImageUrl && (
            <FloorPlanImage
              url={mapImageUrl}
              width={dimensions.width}
              height={dimensions.height}
              onImageBoundsChange={handleImageBoundsChange}
              zoomBounds={currentLocation?.zoomBounds as any}
            />
          )}
        </Layer>

        {/* People Layer */}
        <Layer>
          {peopleWithCoords.map((person) => {
            const personCoords = toCanvasCoords({ x: person.x!, y: person.y! })
            const isSelected = selectedPersonId === person.id
            const isHovered = hoveredPerson?.id === person.id
            const isDragging = draggedPerson?.id === person.id

            let displayX = personCoords.x
            let displayY = personCoords.y

            if (isDragging && draggedPerson.dragX !== undefined && draggedPerson.dragY !== undefined) {
              displayX = draggedPerson.dragX
              displayY = draggedPerson.dragY
            }

            return (
              <Group
                key={person.id}
                name="person-group"
                x={displayX}
                y={displayY}
                draggable={mode === 'move'}
                listening={true}
                perfectDrawEnabled={false}
                hitStrokeWidth={0}
                dragBoundFunc={(pos) => {
                  // Constrain dragging to canvas bounds
                  return {
                    x: Math.max(0, Math.min(dimensions.width, pos.x)),
                    y: Math.max(0, Math.min(dimensions.height, pos.y))
                  }
                }}
                onDragStart={(e) => handlePersonDragStart(e, person)}
                onDragMove={handlePersonDrag}
                onDragEnd={handlePersonDragEnd}
                onClick={() => onPersonSelect?.(person.id)}
                onTap={() => onPersonSelect?.(person.id)}
                onMouseEnter={() => setHoveredPerson(person)}
                onMouseLeave={() => setHoveredPerson(null)}
              >
                {/* Person icon circle */}
                <Circle
                  name="person-circle"
                  radius={isSelected ? 12 : (isHovered ? 10 : 8)}
                  fill={isSelected ? colors.primary : getRgbaVariable('--color-primary', 0.7)}
                  stroke={isSelected ? colors.text : colors.border}
                  strokeWidth={isSelected ? 3 : 2}
                  shadowBlur={isSelected ? 8 : (isHovered ? 4 : 2)}
                  shadowColor={colors.primary}
                  shadowOpacity={0.4}
                  listening={true}
                />
                {/* Person icon (simplified - using circle with "P" text) */}
                <Text
                  text="👤"
                  fontSize={isSelected ? 14 : (isHovered ? 12 : 10)}
                  x={-7}
                  y={-7}
                  fill={colors.text}
                  listening={false}
                />
                {/* Name label on hover/select */}
                {(isSelected || isHovered) && (
                  <Text
                    text={`${person.firstName} ${person.lastName}`}
                    fontSize={12}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fill={colors.text}
                    x={15}
                    y={-6}
                    padding={4}
                    align="left"
                    listening={false}
                  />
                )}
              </Group>
            )
          })}
        </Layer>
      </Stage>
    </div>
  )
}

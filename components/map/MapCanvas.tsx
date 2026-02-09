/**
 * Map Canvas Component
 *
 * Uses react-konva for canvas-based rendering of:
 * - Blueprint/floor plan (background layer)
 * - Device point cloud (overlay)
 * - Zone boundaries
 * - People tokens
 *
 * Refactored: Sub-components extracted to separate files for maintainability.
 * See: ZoneRenderer, FixtureRenderer, SensorRenderer, DeviceTooltip, etc.
 */

'use client'

import { Stage, Layer, Group, Circle, Text, Rect } from 'react-konva'
import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { Component, Device as DeviceType, DeviceType as DeviceTypeEnum } from '@/lib/mockData'
import { useZoomContext } from '@/lib/hooks/useMap'

import { FloorPlanImage, type ImageBounds } from './FloorPlanImage'
import { MapPersonToken } from './MapPersonToken'
import type { ExtractedVectorData } from '@/lib/pdfVectorExtractor'
import type { Location } from '@/lib/locationStorage'
import { isFixtureType } from '@/lib/deviceUtils'
import { getCanvasColors, getRgbaVariable, getColorVariable } from '@/lib/canvasColors'
import { useSiteStore } from '@/lib/stores/siteStore'

// Extracted components and utilities
import type { DevicePoint, MapZone, PersonPoint, CanvasColors, MapMode, DraggedDeviceState } from './mapTypes'
import { createCoordinateConverters, getDeviceColor } from './canvasUtils'
import { ZoneRenderer } from './ZoneRenderer'
import { FixtureRenderer } from './FixtureRenderer'
import { SensorRenderer } from './SensorRenderer'
import { ComponentTreeOverlay } from './ComponentTreeOverlay'
import { DeviceTooltip } from './DeviceTooltip'
import { PersonTooltip } from './PersonTooltip'
import { SelectionBox } from './SelectionBox'
import { useMapInteractions } from './useMapInteractions'

// Re-export for backwards compatibility
export type { DevicePoint } from './mapTypes'

interface Zone {
  id: string
  name: string
  color: string
  polygon: Array<{ x: number; y: number }>
}

interface MapCanvasProps {
  onDeviceSelect?: (deviceId: string | null) => void
  onDevicesSelect?: (deviceIds: string[]) => void
  selectedDeviceId?: string | null
  selectedDeviceIds?: string[]
  mapImageUrl?: string | null
  vectorData?: ExtractedVectorData | null
  devices?: DevicePoint[]
  zones?: Zone[]
  people?: PersonPoint[]
  highlightDeviceId?: string | null
  mode?: MapMode
  onDeviceMove?: (deviceId: string, x: number, y: number) => void
  onDeviceMoveEnd?: (deviceId: string, x: number, y: number) => void
  onDevicesMoveEnd?: (updates: { deviceId: string; x: number; y: number }[]) => void
  onDeviceRotate?: (deviceId: string) => void
  onLassoAlign?: (deviceIds: string[]) => void
  onLassoArrange?: (deviceIds: string[]) => void
  onComponentExpand?: (deviceId: string, expanded: boolean) => void
  expandedComponents?: Set<string>
  onComponentClick?: (component: Component, parentDevice: any) => void
  devicesData?: any[]
  onZoneClick?: (zoneId: string) => void
  showWalls?: boolean
  showAnnotations?: boolean
  showText?: boolean
  showZones?: boolean
  showPeople?: boolean
  tooltipDetailLevel?: 'minimal' | 'detailed'
  onPersonSelect?: (personId: string | null) => void
  currentLocation?: Location | null
  onImageBoundsChange?: (bounds: ImageBounds) => void
  externalScale?: number
  externalStagePosition?: { x: number; y: number }
  onScaleChange?: (scale: number) => void
  onStagePositionChange?: (position: { x: number; y: number }) => void
}

export function MapCanvas({
  onDeviceSelect,
  onDevicesSelect,
  selectedDeviceId,
  selectedDeviceIds = [],
  mapImageUrl,
  vectorData,
  devices = [],
  zones = [],
  people = [],
  highlightDeviceId,
  mode = 'select',
  onDeviceMove,
  onDeviceMoveEnd,
  onDevicesMoveEnd,
  onDeviceRotate,
  onLassoAlign,
  onLassoArrange,
  onComponentExpand,
  expandedComponents = new Set(),
  onComponentClick,
  devicesData = [],
  onZoneClick,
  showWalls = true,
  showAnnotations = true,
  showText = true,
  showZones = true,
  showPeople = true,
  tooltipDetailLevel = 'detailed',
  onPersonSelect,
  currentLocation,
  onImageBoundsChange,
  externalScale,
  externalStagePosition,
  onScaleChange,
  onStagePositionChange,
}: MapCanvasProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<any>(null)
  const imageBoundsRef = useRef<ImageBounds | null>(null)
  const tooltipPositionRef = useRef({ x: 0, y: 0 })
  const tooltipUpdateFrameRef = useRef<number | null>(null)

  // Site switching state - fade out during transition to prevent flicker
  const isSwitching = useSiteStore((state) => state.isSwitching)

  // Dimensions and zoom state
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [stagePosition, setStagePositionInternal] = useState({ x: 0, y: 0 })
  const [scale, setScaleInternal] = useState(1)
  const { setZoomLevel, triggerZoomIndicator, setInteractionHint } = useZoomContext()

  // Use external state if provided
  const effectiveScale = externalScale ?? scale
  const effectiveStagePosition = externalStagePosition ?? stagePosition

  // Image and theme state
  const [imageBounds, setImageBounds] = useState<ImageBounds | null>(null)
  const [colors, setColors] = useState<CanvasColors>(getCanvasColors() as CanvasColors)

  // Hover states
  const [hoveredDevice, setHoveredDevice] = useState<DevicePoint | null>(null)
  const [hoveredPerson, setHoveredPerson] = useState<PersonPoint | null>(null)
  const [personTooltipTier, setPersonTooltipTier] = useState<1 | 2>(1)
  const personTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [personTooltipPosition, setPersonTooltipPosition] = useState({ x: 0, y: 0 })
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null)

  // Wrapper functions for scale and position
  const setScale = useCallback(
    (newScale: number) => {
      setScaleInternal(newScale)
      onScaleChange?.(newScale)
      setZoomLevel(newScale)
      triggerZoomIndicator()
    },
    [onScaleChange, setZoomLevel, triggerZoomIndicator]
  )

  const setStagePosition = useCallback(
    (newPosition: { x: number; y: number }) => {
      setStagePositionInternal(newPosition)
      onStagePositionChange?.(newPosition)
    },
    [onStagePositionChange]
  )

  // Sort devices for keyboard navigation
  const sortedDevices = useMemo(() => {
    return [...devices].sort((a, b) => a.deviceId.localeCompare(b.deviceId))
  }, [devices])

  // Use extracted interactions hook
  const interactions = useMapInteractions({
    mode,
    selectedDeviceId: selectedDeviceId ?? null,
    selectedDeviceIds,
    sortedDevices,
    effectiveScale,
    stageRef,
    onDeviceSelect,
    onDevicesSelect,
    setScale,
    setInteractionHint,
  })

  const {
    isShiftHeld,
    isSpaceHeld,
    isSelecting,
    selectionStart,
    selectionEnd,
    draggedDevice,
    setIsShiftHeld,
    setIsSelecting,
    setSelectionStart,
    setSelectionEnd,
    setDraggedDevice,
    clearSelection,
  } = interactions

  // Keep refs in sync
  useEffect(() => {
    imageBoundsRef.current = imageBounds
  }, [imageBounds])

  // Coordinate conversion utilities
  const { toCanvasCoords, fromCanvasCoords } = useMemo(
    () => createCoordinateConverters(imageBounds, dimensions, currentLocation),
    [imageBounds, dimensions, currentLocation]
  )

  // Viewport culling for performance
  const stagePositionRef = useRef(effectiveStagePosition)
  const scaleRef = useRef(effectiveScale)

  useEffect(() => {
    stagePositionRef.current = effectiveStagePosition
    scaleRef.current = effectiveScale
  }, [effectiveStagePosition, effectiveScale])

  const visibleDevices = useMemo(() => {
    const viewportPadding = 200
    const viewportMinX = -stagePositionRef.current.x / scaleRef.current - viewportPadding
    const viewportMaxX = (-stagePositionRef.current.x + dimensions.width) / scaleRef.current + viewportPadding
    const viewportMinY = -stagePositionRef.current.y / scaleRef.current - viewportPadding
    const viewportMaxY = (-stagePositionRef.current.y + dimensions.height) / scaleRef.current + viewportPadding

    return devices.filter((device) => {
      const deviceCoords = toCanvasCoords({ x: device.x, y: device.y })
      return (
        deviceCoords.x >= viewportMinX &&
        deviceCoords.x <= viewportMaxX &&
        deviceCoords.y >= viewportMinY &&
        deviceCoords.y <= viewportMaxY
      )
    })
  }, [devices, dimensions, toCanvasCoords])

  // Get full device data for hovered device
  const hoveredDeviceData = useMemo(() => {
    if (!hoveredDevice || !devicesData) return null
    return devicesData.find((d) => d.id === hoveredDevice.id) || null
  }, [hoveredDevice, devicesData])

  // Image bounds change handler
  const handleImageBoundsChange = useCallback(
    (bounds: ImageBounds) => {
      setImageBounds((prev) => {
        if (
          !prev ||
          prev.x !== bounds.x ||
          prev.y !== bounds.y ||
          prev.width !== bounds.width ||
          prev.height !== bounds.height
        ) {
          return bounds
        }
        return prev
      })
      onImageBoundsChange?.(bounds)
    },
    [onImageBoundsChange]
  )

  // Throttled tooltip position update
  const updateTooltipPosition = useCallback((x: number, y: number) => {
    tooltipPositionRef.current = { x, y }
    if (tooltipUpdateFrameRef.current === null) {
      tooltipUpdateFrameRef.current = requestAnimationFrame(() => {
        setTooltipPosition(tooltipPositionRef.current)
        tooltipUpdateFrameRef.current = null
      })
    }
  }, [])

  // Person tooltip tier timer
  useEffect(() => {
    if (!hoveredPerson) {
      setPersonTooltipTier(1)
      if (personTooltipTimerRef.current) {
        clearTimeout(personTooltipTimerRef.current)
        personTooltipTimerRef.current = null
      }
      return
    }
    setPersonTooltipTier(1)
    personTooltipTimerRef.current = setTimeout(() => {
      setPersonTooltipTier(2)
      personTooltipTimerRef.current = null
    }, 700)
    return () => {
      if (personTooltipTimerRef.current) {
        clearTimeout(personTooltipTimerRef.current)
        personTooltipTimerRef.current = null
      }
    }
  }, [hoveredPerson])

  // Resize observer for container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({
          width: Math.max(rect.width, 400),
          height: Math.max(rect.height, 400),
        })
      }
    }

    const updateColors = () => {
      setColors(getCanvasColors() as CanvasColors)
    }

    updateDimensions()
    updateColors()

    const resizeObserver = new ResizeObserver(() => updateDimensions())
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    window.addEventListener('resize', updateDimensions)

    const mutationObserver = new MutationObserver(updateColors)
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateDimensions)
      mutationObserver.disconnect()
    }
  }, [])

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (tooltipUpdateFrameRef.current !== null) {
        cancelAnimationFrame(tooltipUpdateFrameRef.current)
      }
    }
  }, [])

  // Prevent stage from capturing clicks outside bounds
  useEffect(() => {
    if (!stageRef.current) return

    const container = stageRef.current.container()
    if (!container) return

    container.style.pointerEvents = 'auto'
    container.style.touchAction = 'none'

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
        e.stopImmediatePropagation()
      }
    }

    container.addEventListener('click', handleClick, true)
    container.addEventListener('mousedown', handleClick, true)

    return () => {
      container.removeEventListener('click', handleClick, true)
      container.removeEventListener('mousedown', handleClick, true)
    }
  }, [dimensions])

  // Stage event handlers
  const handleStageMouseDown = useCallback(
    (e: any) => {
      const stage = e.target.getStage()
      if (!stage) return

      const pointerPos = stage.getPointerPosition()
      if (pointerPos) {
        if (pointerPos.x < 0 || pointerPos.x > dimensions.width || pointerPos.y < 0 || pointerPos.y > dimensions.height) {
          return
        }
      }

      const isLassoMode = mode === 'align-direction' || mode === 'auto-arrange' || mode === 'move'
      const canSelect = mode === 'select' || isLassoMode

      if (canSelect && e.evt.button === 0 && !draggedDevice && !isSpaceHeld) {
        const shiftHeld = isShiftHeld || e.evt.shiftKey
        const clickedOnEmpty = e.target === stage || e.target === stage.findOne('Layer')

        if (shiftHeld || isLassoMode) {
          if (pointerPos) {
            const transform = stage.getAbsoluteTransform().copy().invert()
            const pos = transform.point(pointerPos)
            setIsSelecting(true)
            setSelectionStart({ x: pos.x, y: pos.y })
            setSelectionEnd({ x: pos.x, y: pos.y })
          }
        } else if (clickedOnEmpty && !shiftHeld) {
          clearSelection()
        }
      }
    },
    [mode, draggedDevice, isSpaceHeld, isShiftHeld, dimensions, setIsSelecting, setSelectionStart, setSelectionEnd, clearSelection]
  )

  const handleStageMouseMove = useCallback(
    (e: any) => {
      const stage = e.target.getStage()
      if (!stage) return

      if (isSelecting && selectionStart) {
        const pointerPos = stage.getPointerPosition()
        if (pointerPos) {
          const transform = stage.getAbsoluteTransform().copy().invert()
          const pos = transform.point(pointerPos)
          setSelectionEnd({ x: pos.x, y: pos.y })
        }
      } else {
        const shiftHeld = e.evt.shiftKey
        if (shiftHeld !== isShiftHeld) {
          setIsShiftHeld(shiftHeld)
        }

        if (shiftHeld && mode === 'select' && !draggedDevice) {
          const container = stage.container()
          if (container) {
            container.style.cursor = 'crosshair'
          }
        } else if (!shiftHeld) {
          const container = stage.container()
          if (container) {
            container.style.cursor = 'default'
          }
        }
      }
    },
    [isSelecting, selectionStart, isShiftHeld, mode, draggedDevice, setSelectionEnd, setIsShiftHeld]
  )

  const handleStageMouseUp = useCallback(
    (e: any) => {
      if (isSelecting && selectionStart && selectionEnd) {
        const minX = Math.min(selectionStart.x, selectionEnd.x)
        const maxX = Math.max(selectionStart.x, selectionEnd.x)
        const minY = Math.min(selectionStart.y, selectionEnd.y)
        const maxY = Math.max(selectionStart.y, selectionEnd.y)

        const width = Math.abs(selectionEnd.x - selectionStart.x)
        const height = Math.abs(selectionEnd.y - selectionStart.y)

        if (width > 5 || height > 5) {
          const selectedIds: string[] = []
          const tolerance = 5

          visibleDevices.forEach((device) => {
            const deviceCoords = toCanvasCoords({ x: device.x, y: device.y })
            if (
              deviceCoords.x >= minX - tolerance &&
              deviceCoords.x <= maxX + tolerance &&
              deviceCoords.y >= minY - tolerance &&
              deviceCoords.y <= maxY + tolerance
            ) {
              selectedIds.push(device.id)
            }
          })

          if (selectedIds.length > 0) {
            if (mode === 'align-direction') {
              onLassoAlign?.(selectedIds)
            } else if (mode === 'auto-arrange') {
              onLassoArrange?.(selectedIds)
            } else if (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) {
              const newSelection = [...new Set([...selectedDeviceIds, ...selectedIds])]
              onDevicesSelect?.(newSelection)
              if (newSelection.length === 1) {
                onDeviceSelect?.(newSelection[0])
              }
            } else {
              onDevicesSelect?.(selectedIds)
              if (selectedIds.length === 1) {
                onDeviceSelect?.(selectedIds[0])
              } else {
                onDeviceSelect?.(null)
              }
            }
          } else if (!e.evt.shiftKey && !e.evt.ctrlKey && !e.evt.metaKey) {
            onDevicesSelect?.([])
            onDeviceSelect?.(null)
          }
        }

        setIsSelecting(false)
        setSelectionStart(null)
        setSelectionEnd(null)
      }
    },
    [
      isSelecting,
      selectionStart,
      selectionEnd,
      visibleDevices,
      toCanvasCoords,
      mode,
      selectedDeviceIds,
      onLassoAlign,
      onLassoArrange,
      onDevicesSelect,
      onDeviceSelect,
      setIsSelecting,
      setSelectionStart,
      setSelectionEnd,
    ]
  )

  const handleStageWheel = useCallback(
    (e: any) => {
      e.evt.preventDefault()

      const stage = e.target.getStage()
      if (!stage) return

      const pointerPos = stage.getPointerPosition()
      if (!pointerPos) return

      const deltaY = e.evt.deltaY
      const zoomFactor = deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.max(0.1, Math.min(10, effectiveScale * zoomFactor))

      const mouseX = (pointerPos.x - effectiveStagePosition.x) / effectiveScale
      const mouseY = (pointerPos.y - effectiveStagePosition.y) / effectiveScale

      const newX = pointerPos.x - mouseX * newScale
      const newY = pointerPos.y - mouseY * newScale

      requestAnimationFrame(() => {
        setScale(newScale)
        setStagePosition({ x: newX, y: newY })
      })
    },
    [effectiveScale, effectiveStagePosition, setScale, setStagePosition]
  )

  // Device drag handlers
  const handleDeviceDragStart = useCallback(
    (device: DevicePoint, deviceCoords: { x: number; y: number }, e: any) => {
      e.cancelBubble = true
      setIsSelecting(false)
      setSelectionStart(null)
      setSelectionEnd(null)
      setDraggedDevice({
        id: device.id,
        startX: device.x || 0,
        startY: device.y || 0,
        startCanvasX: deviceCoords.x,
        startCanvasY: deviceCoords.y,
      })
      setHoveredDevice(null)
      if (!selectedDeviceIds.includes(device.id)) {
        if (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) {
          onDevicesSelect?.([...selectedDeviceIds, device.id])
        } else {
          onDevicesSelect?.([device.id])
          onDeviceSelect?.(device.id)
        }
      }
    },
    [selectedDeviceIds, onDevicesSelect, onDeviceSelect, setIsSelecting, setSelectionStart, setSelectionEnd, setDraggedDevice]
  )

  const handleDeviceDragMove = useCallback(
    (e: any) => {
      e.cancelBubble = true
      const pos = e.target.position()
      if (draggedDevice) {
        setDraggedDevice({
          ...draggedDevice,
          dragX: pos.x,
          dragY: pos.y,
        })
      }
    },
    [draggedDevice, setDraggedDevice]
  )

  const handleDeviceDragEnd = useCallback(
    (device: DevicePoint, deviceCoords: { x: number; y: number }, e: any) => {
      e.cancelBubble = true

      if (mode === 'move') {
        if (selectedDeviceIds.includes(device.id) && selectedDeviceIds.length > 1) {
          const pos = e.target.position()
          const deviceStartCanvasX = draggedDevice?.startCanvasX || deviceCoords.x
          const deviceStartCanvasY = draggedDevice?.startCanvasY || deviceCoords.y

          const deltaX = pos.x - deviceStartCanvasX
          const deltaY = pos.y - deviceStartCanvasY

          const updates: { deviceId: string; x: number; y: number }[] = []

          selectedDeviceIds.forEach((id) => {
            const d = devices.find((dev) => dev.id === id)
            if (d) {
              const dCanvas = toCanvasCoords({ x: d.x || 0, y: d.y || 0 })
              const newCanvasX = dCanvas.x + deltaX
              const newCanvasY = dCanvas.y + deltaY
              const normalized = fromCanvasCoords({ x: newCanvasX, y: newCanvasY })

              updates.push({
                deviceId: id,
                x: Math.max(0, Math.min(1, normalized.x)),
                y: Math.max(0, Math.min(1, normalized.y)),
              })
            }
          })

          if (updates.length > 0) {
            onDevicesMoveEnd?.(updates)
          }
        } else if (onDeviceMoveEnd) {
          const pos = e.target.position()
          const normalized = fromCanvasCoords({ x: pos.x, y: pos.y })
          const normalizedX = Math.max(0, Math.min(1, normalized.x))
          const normalizedY = Math.max(0, Math.min(1, normalized.y))
          onDeviceMoveEnd(device.id, normalizedX, normalizedY)
        }
      }
      setDraggedDevice(null)
    },
    [mode, selectedDeviceIds, draggedDevice, devices, toCanvasCoords, fromCanvasCoords, onDevicesMoveEnd, onDeviceMoveEnd, setDraggedDevice]
  )

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden transition-opacity duration-150"
      style={{ opacity: isSwitching ? 0 : 1 }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={effectiveStagePosition.x}
        y={effectiveStagePosition.y}
        scaleX={effectiveScale}
        scaleY={effectiveScale}
        draggable={mode === 'select' && !isSelecting && !isShiftHeld && draggedDevice === null && isSpaceHeld}
        style={{ touchAction: 'none' }}
        onDblClick={(e) => {
          const stage = e.target.getStage()
          if (!stage) return
          const target = e.target
          const targetType = target.getType?.() || ''
          const isDevice = targetType === 'Circle' || targetType === 'Rect'
          const clickedOnMap =
            target === stage ||
            target === stage.findOne('Layer') ||
            targetType === 'Image' ||
            targetType === 'Line' ||
            (targetType === 'Group' && !isDevice)

          if (clickedOnMap && mode === 'select') {
            clearSelection()
          }
        }}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onDragEnd={(e) => {
          requestAnimationFrame(() => {
            setStagePosition({ x: e.target.x(), y: e.target.y() })
          })
        }}
        onWheel={handleStageWheel}
      >
        <Layer>
          {/* Floor Plan Background */}
          {mapImageUrl && (
            <Group
              onDblClick={(e) => {
                if (mode === 'select') {
                  e.cancelBubble = true
                  clearSelection()
                }
              }}
            >
              <FloorPlanImage
                url={mapImageUrl}
                width={dimensions.width}
                height={dimensions.height}
                onImageBoundsChange={handleImageBoundsChange}
                zoomBounds={currentLocation?.type === 'zoom' ? currentLocation.zoomBounds : null}
              />
            </Group>
          )}

          {/* Zones */}
          {showZones && (
            <ZoneRenderer
              zones={zones as MapZone[]}
              selectedDeviceIds={selectedDeviceIds}
              hoveredZoneId={hoveredZoneId}
              mode={mode}
              isShiftHeld={isShiftHeld}
              stageRef={stageRef}
              onZoneClick={onZoneClick}
              onZoneHover={setHoveredZoneId}
              onDeselect={clearSelection}
              toCanvasCoords={toCanvasCoords}
            />
          )}

          {/* Devices */}
          {imageBounds &&
            visibleDevices.map((device) => {
              const deviceCoords = toCanvasCoords({ x: device.x, y: device.y })
              const isSelected = selectedDeviceId === device.id || selectedDeviceIds.includes(device.id)
              const isHovered = hoveredDevice?.id === device.id

              const isDragging = draggedDevice?.id === device.id
              const isGroupDragging =
                draggedDevice &&
                selectedDeviceIds.includes(draggedDevice.id) &&
                selectedDeviceIds.includes(device.id) &&
                !isDragging

              let groupX = deviceCoords.x
              let groupY = deviceCoords.y

              if (isDragging && draggedDevice.dragX !== undefined && draggedDevice.dragY !== undefined) {
                groupX = draggedDevice.dragX
                groupY = draggedDevice.dragY
              } else if (
                isGroupDragging &&
                draggedDevice.dragX !== undefined &&
                draggedDevice.dragY !== undefined &&
                draggedDevice.startCanvasX !== undefined
              ) {
                const deltaX = draggedDevice.dragX - draggedDevice.startCanvasX
                const deltaY = draggedDevice.dragY - draggedDevice.startCanvasY
                groupX = deviceCoords.x + deltaX
                groupY = deviceCoords.y + deltaY
              }

              return (
                <Group
                  key={device.id}
                  x={groupX}
                  y={groupY}
                  draggable={mode === 'move'}
                  listening={true}
                  perfectDrawEnabled={false}
                  hitStrokeWidth={0}
                  dragBoundFunc={(pos) => ({
                    x: Math.max(0, Math.min(dimensions.width, pos.x)),
                    y: Math.max(0, Math.min(dimensions.height, pos.y)),
                  })}
                  onDragStart={(e) => handleDeviceDragStart(device, deviceCoords, e)}
                  onDragMove={handleDeviceDragMove}
                  onDragEnd={(e) => handleDeviceDragEnd(device, deviceCoords, e)}
                >
                  {isFixtureType(device.type) ? (
                    <FixtureRenderer
                      device={device}
                      isSelected={isSelected}
                      isHovered={isHovered}
                      colors={colors}
                      mode={mode}
                      selectedDeviceIds={selectedDeviceIds}
                      expandedComponents={expandedComponents}
                      onDeviceSelect={onDeviceSelect}
                      onDevicesSelect={onDevicesSelect}
                      onDeviceRotate={onDeviceRotate}
                      onHover={setHoveredDevice}
                      updateTooltipPosition={updateTooltipPosition}
                    />
                  ) : (
                    <SensorRenderer
                      device={device}
                      isSelected={isSelected}
                      isHovered={isHovered}
                      colors={colors}
                      mode={mode}
                      selectedDeviceIds={selectedDeviceIds}
                      onDeviceSelect={onDeviceSelect}
                      onDevicesSelect={onDevicesSelect}
                      onHover={setHoveredDevice}
                      updateTooltipPosition={updateTooltipPosition}
                    />
                  )}

                  {/* Lock indicator */}
                  {device.locked && (
                    <Circle x={6} y={-6} radius={3} fill={colors.warning} stroke={colors.text} strokeWidth={1} listening={false} />
                  )}

                  {/* Expand button */}
                  {isSelected && device.components && device.components.length > 0 && (
                    <Group
                      x={8}
                      y={-8}
                      onClick={(e) => {
                        e.cancelBubble = true
                        onComponentExpand?.(device.id, !expandedComponents.has(device.id))
                      }}
                      onTap={(e) => {
                        e.cancelBubble = true
                        onComponentExpand?.(device.id, !expandedComponents.has(device.id))
                      }}
                      onMouseEnter={(e) => {
                        const container = e.target.getStage()?.container()
                        if (container) container.style.cursor = 'pointer'
                      }}
                      onMouseLeave={(e) => {
                        const container = e.target.getStage()?.container()
                        if (container) container.style.cursor = 'default'
                      }}
                    >
                      <Circle
                        x={0}
                        y={0}
                        radius={3.5}
                        fill={colors.primary}
                        stroke={getColorVariable('--color-canvas-stroke-dark', 'rgba(0,0,0,0.3)')}
                        strokeWidth={0.5}
                        opacity={0.9}
                      />
                      <Text
                        x={0}
                        y={0}
                        offsetX={3}
                        offsetY={4}
                        text={expandedComponents.has(device.id) ? '−' : '+'}
                        fontSize={8}
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontStyle="bold"
                        fill={colors.text}
                        width={6}
                        align="center"
                        listening={false}
                      />
                    </Group>
                  )}

                  {/* Component tree overlay */}
                  {isSelected && device.components && device.components.length > 0 && expandedComponents.has(device.id) && (
                    <ComponentTreeOverlay
                      deviceId={device.id}
                      components={device.components}
                      colors={colors}
                      devicesData={devicesData}
                      onComponentClick={onComponentClick}
                    />
                  )}
                </Group>
              )
            })}
        </Layer>

        {/* People Layer */}
        {showPeople && imageBounds && (
          <Layer>
            {people
              .filter((person) => person.x !== null && person.x !== undefined && person.y !== null && person.y !== undefined)
              .map((person) => {
                const personCoords = toCanvasCoords({ x: person.x, y: person.y })
                const isHovered = hoveredPerson?.id === person.id

                return (
                  <Group
                    key={person.id}
                    x={personCoords.x}
                    y={personCoords.y}
                    listening={true}
                    onClick={() => onPersonSelect?.(person.id)}
                    onTap={() => onPersonSelect?.(person.id)}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage()?.container()
                      if (container) container.style.cursor = onPersonSelect ? 'pointer' : 'default'
                      setHoveredPerson(person)
                      const stage = e.target.getStage()
                      if (stage) {
                        const pointerPos = stage.getPointerPosition()
                        if (pointerPos) setPersonTooltipPosition({ x: pointerPos.x, y: pointerPos.y })
                      }
                    }}
                    onMouseLeave={() => setHoveredPerson(null)}
                    onMouseMove={(e) => {
                      const stage = e.target.getStage()
                      if (stage) {
                        const pointerPos = stage.getPointerPosition()
                        if (pointerPos) setPersonTooltipPosition({ x: pointerPos.x, y: pointerPos.y })
                      }
                    }}
                  >
                    <MapPersonToken person={person} isHovered={isHovered} radius={7} scale={1 / effectiveScale} />
                  </Group>
                )
              })}
          </Layer>
        )}

        {/* Tooltip Layer */}
        <Layer>
          {hoveredPerson && (
            <PersonTooltip
              person={hoveredPerson}
              tier={personTooltipTier}
              position={personTooltipPosition}
              dimensions={dimensions}
              colors={colors}
            />
          )}
          {hoveredDevice && hoveredDeviceData && !draggedDevice && mode !== 'move' && (
            <DeviceTooltip
              device={hoveredDevice}
              deviceData={hoveredDeviceData}
              position={tooltipPosition}
              dimensions={dimensions}
              colors={colors}
            />
          )}
        </Layer>

        {/* Selection Box Layer */}
        {isSelecting && selectionStart && selectionEnd && (
          <SelectionBox
            selectionStart={selectionStart}
            selectionEnd={selectionEnd}
            devices={devices}
            colors={colors}
            toCanvasCoords={toCanvasCoords}
          />
        )}
      </Stage>
    </div>
  )
}

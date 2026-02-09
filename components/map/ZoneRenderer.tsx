/**
 * Zone Renderer Component
 *
 * Renders zone polygons on the map canvas with hover effects.
 * Extracted from MapCanvas.tsx for modularity.
 */

'use client'

import { Group, Line, Text } from 'react-konva'
import type { MapZone, CanvasColors } from './mapTypes'
import { resolveZoneColor } from '@/lib/zoneColors'

interface ZoneRendererProps {
    zones: MapZone[]
    selectedDeviceIds: string[]
    hoveredZoneId: string | null
    mode: 'select' | 'move' | 'rotate' | 'align-direction' | 'auto-arrange'
    isShiftHeld: boolean
    stageRef: React.RefObject<any>
    onZoneClick?: (zoneId: string) => void
    onZoneHover: (zoneId: string | null) => void
    onDeselect: () => void
    toCanvasCoords: (point: { x: number; y: number }) => { x: number; y: number }
}

export function ZoneRenderer({
    zones,
    selectedDeviceIds,
    hoveredZoneId,
    mode,
    isShiftHeld,
    stageRef,
    onZoneClick,
    onZoneHover,
    onDeselect,
    toCanvasCoords,
}: ZoneRendererProps) {
    const hasSelectedDevices = selectedDeviceIds.length > 0

    return (
        <>
            {zones.map((zone) => {
                const points = zone.polygon.map(toCanvasCoords).flatMap((p) => [p.x, p.y])
                const zoneColor = resolveZoneColor(zone.color)
                const isHovered = hoveredZoneId === zone.id

                // Calculate center for label
                const centerX =
                    points.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0) / (points.length / 2) - 30
                const centerY =
                    points.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0) / (points.length / 2) - 8

                return (
                    <Group
                        key={zone.id}
                        onClick={() => {
                            if (onZoneClick && mode === 'select') {
                                onZoneClick(zone.id)
                            }
                        }}
                        onTap={() => {
                            if (onZoneClick && mode === 'select') {
                                onZoneClick(zone.id)
                            }
                        }}
                        onDblClick={(e) => {
                            // Double-click on zone to deselect
                            if (mode === 'select') {
                                e.cancelBubble = true
                                onDeselect()
                            }
                        }}
                        onMouseEnter={() => {
                            onZoneHover(zone.id)
                            if (hasSelectedDevices && mode === 'select') {
                                const container = stageRef.current?.container()
                                if (container) {
                                    container.style.cursor = 'pointer'
                                }
                            }
                        }}
                        onMouseLeave={() => {
                            onZoneHover(null)
                            if (hasSelectedDevices && mode === 'select') {
                                const container = stageRef.current?.container()
                                if (container) {
                                    container.style.cursor = isShiftHeld ? 'crosshair' : 'default'
                                }
                            }
                        }}
                    >
                        <Line
                            points={points}
                            fill={hasSelectedDevices && isHovered ? `${zoneColor}40` : `${zoneColor}20`}
                            stroke={zoneColor}
                            strokeWidth={hasSelectedDevices && isHovered ? 2 : 1}
                            closed
                            opacity={hasSelectedDevices && isHovered ? 0.5 : 0.3}
                            listening={true}
                            shadowBlur={hasSelectedDevices && isHovered ? 15 : 0}
                            shadowColor={zoneColor}
                        />
                        <Text
                            x={centerX}
                            y={centerY}
                            text={
                                hasSelectedDevices && isHovered
                                    ? `Click to arrange ${selectedDeviceIds.length} device${selectedDeviceIds.length !== 1 ? 's' : ''}`
                                    : zone.name
                            }
                            fontSize={hasSelectedDevices && isHovered ? 11 : 12}
                            fontFamily="system-ui, -apple-system, sans-serif"
                            fill={zoneColor}
                            opacity={hasSelectedDevices && isHovered ? 0.9 : 0.6}
                            listening={false}
                            fontStyle={hasSelectedDevices && isHovered ? 'bold' : 'normal'}
                        />
                    </Group>
                )
            })}
        </>
    )
}

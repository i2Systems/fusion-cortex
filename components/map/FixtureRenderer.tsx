/**
 * Fixture Renderer Component
 *
 * Renders fixture devices as rectangles with rotation support.
 * Size varies by fixture type (8ft/12ft/16ft).
 * Extracted from MapCanvas.tsx for modularity.
 */

'use client'

import { Group, Circle, Rect } from 'react-konva'
import type { DevicePoint, CanvasColors, MapMode } from './mapTypes'
import { getFixtureSizeMultiplier, getDeviceColor } from './canvasUtils'

interface FixtureRendererProps {
    device: DevicePoint
    isSelected: boolean
    isHovered: boolean
    colors: CanvasColors
    mode: MapMode
    selectedDeviceIds: string[]
    expandedComponents: Set<string>
    onDeviceSelect?: (deviceId: string | null) => void
    onDevicesSelect?: (deviceIds: string[]) => void
    onDeviceRotate?: (deviceId: string) => void
    onHover: (device: DevicePoint | null) => void
    updateTooltipPosition: (x: number, y: number) => void
}

export function FixtureRenderer({
    device,
    isSelected,
    isHovered,
    colors,
    mode,
    selectedDeviceIds,
    onDeviceSelect,
    onDevicesSelect,
    onDeviceRotate,
    onHover,
    updateTooltipPosition,
}: FixtureRendererProps) {
    // Get size multiplier based on fixture type (8ft, 12ft, 16ft)
    const sizeMultiplier = getFixtureSizeMultiplier(device.type)

    // Base size for 8ft fixture: small rectangle matching the blueprint
    // Base rectangle: width ~12px, height ~3px (4:1 ratio for a small rectangle)
    const baseWidth = 12
    const baseHeight = 3

    // Apply size multiplier
    const barLength = baseWidth * sizeMultiplier
    const barWidth = baseHeight * sizeMultiplier

    // Larger invisible hit area for easier clicking
    const hitAreaRadius = Math.max(20, barLength / 2 + 10)

    const handleClick = (e: any) => {
        e.cancelBubble = true
        if (mode === 'rotate') {
            onDeviceRotate?.(device.id)
        } else if (mode === 'select') {
            if (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) {
                // Toggle selection
                if (selectedDeviceIds.includes(device.id)) {
                    const newSelection = selectedDeviceIds.filter((id) => id !== device.id)
                    onDevicesSelect?.(newSelection)
                    if (newSelection.length === 1) {
                        onDeviceSelect?.(newSelection[0])
                    } else if (newSelection.length === 0) {
                        onDeviceSelect?.(null)
                    }
                } else {
                    const newSelection = [...selectedDeviceIds, device.id]
                    onDevicesSelect?.(newSelection)
                    if (newSelection.length === 1) {
                        onDeviceSelect?.(device.id)
                    }
                }
            } else {
                // Single select
                onDevicesSelect?.([device.id])
                onDeviceSelect?.(device.id)
            }
        }
    }

    const handleTap = (e: any) => {
        e.cancelBubble = true
        if (mode === 'rotate') {
            onDeviceRotate?.(device.id)
        } else if (mode === 'select') {
            onDevicesSelect?.([device.id])
            onDeviceSelect?.(device.id)
        }
    }

    const handleMouseEnter = (e: any) => {
        const container = e.target.getStage()?.container()
        if (container) {
            if (device.locked) {
                container.style.cursor = 'not-allowed'
            } else {
                container.style.cursor = mode === 'move' ? 'grab' : 'pointer'
            }
        }
        onHover(device)
        const stage = e.target.getStage()
        if (stage) {
            const pointerPos = stage.getPointerPosition()
            if (pointerPos) {
                updateTooltipPosition(pointerPos.x, pointerPos.y)
            }
        }
    }

    const handleMouseLeave = () => {
        onHover(null)
    }

    const handleMouseMove = (e: any) => {
        const stage = e.target.getStage()
        if (stage) {
            const pointerPos = stage.getPointerPosition()
            if (pointerPos) {
                updateTooltipPosition(pointerPos.x, pointerPos.y)
            }
        }
    }

    return (
        <Group rotation={device.orientation || 0}>
            {/* Large invisible hit area for easier clicking */}
            <Circle
                x={0}
                y={0}
                radius={hitAreaRadius}
                fill="transparent"
                opacity={0}
                onClick={handleClick}
                onTap={handleTap}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
            />
            {/* Dark outline for contrast */}
            <Rect
                x={-barLength / 2 - 0.5}
                y={-barWidth / 2 - 0.5}
                width={barLength + 1}
                height={barWidth + 1}
                fill="transparent"
                stroke={colors.border}
                strokeWidth={1}
                cornerRadius={2}
                listening={false}
            />
            {/* Fixture rectangle */}
            <Rect
                x={-barLength / 2}
                y={-barWidth / 2}
                width={barLength}
                height={barWidth}
                fill={getDeviceColor(device.type, colors)}
                opacity={device.locked ? 0.6 : isSelected ? 1 : isHovered ? 0.95 : 0.9}
                stroke={colors.border}
                strokeWidth={0.5}
                shadowBlur={isSelected ? 4 : isHovered ? 2 : 1}
                shadowColor={isSelected ? colors.fixture : colors.muted}
                shadowOpacity={0.3}
                cornerRadius={1}
                dash={device.locked ? [4, 4] : undefined}
                listening={false}
            />
            {/* Center dot */}
            <Circle
                x={0}
                y={0}
                radius={isSelected ? 2 * sizeMultiplier : isHovered ? 1.5 * sizeMultiplier : 1 * sizeMultiplier}
                fill={isSelected ? colors.fixture : colors.text}
                stroke={colors.border}
                strokeWidth={0.5}
                shadowBlur={isSelected ? 3 : 1}
                shadowColor={colors.muted}
                opacity={device.locked ? 0.7 : isSelected ? 1 : 0.85}
                listening={false}
            />
        </Group>
    )
}

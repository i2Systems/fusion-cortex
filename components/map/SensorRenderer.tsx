/**
 * Sensor Renderer Component
 *
 * Renders motion and light sensor devices as circles.
 * Extracted from MapCanvas.tsx for modularity.
 */

'use client'

import { Fragment } from 'react'
import { Circle } from 'react-konva'
import type { DevicePoint, CanvasColors, MapMode } from './mapTypes'
import { getDeviceColor } from './canvasUtils'

interface SensorRendererProps {
    device: DevicePoint
    isSelected: boolean
    isHovered: boolean
    colors: CanvasColors
    mode: MapMode
    selectedDeviceIds: string[]
    onDeviceSelect?: (deviceId: string | null) => void
    onDevicesSelect?: (deviceIds: string[]) => void
    onHover: (device: DevicePoint | null) => void
    updateTooltipPosition: (x: number, y: number) => void
}

export function SensorRenderer({
    device,
    isSelected,
    isHovered,
    colors,
    mode,
    selectedDeviceIds,
    onDeviceSelect,
    onDevicesSelect,
    onHover,
    updateTooltipPosition,
}: SensorRendererProps) {
    const handleClick = (e: any) => {
        e.cancelBubble = true
        if (mode === 'select') {
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
        if (mode === 'select') {
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
        <Fragment>
            {/* Large invisible hit area for easier clicking */}
            <Circle
                x={0}
                y={0}
                radius={isSelected ? 20 : isHovered ? 18 : 16}
                fill="transparent"
                opacity={0}
                onClick={handleClick}
                onTap={handleTap}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
            />
            {/* Dark outer contrast ring for visibility */}
            <Circle
                x={0}
                y={0}
                radius={isSelected ? 7 : isHovered ? 6.5 : 6}
                fill="transparent"
                stroke={colors.muted}
                strokeWidth={0.5}
                shadowBlur={isSelected ? 6 : isHovered ? 4 : 2}
                shadowColor={colors.muted}
                listening={false}
            />
            {/* Main visual circle */}
            <Circle
                x={0}
                y={0}
                radius={isSelected ? 5 : isHovered ? 4.5 : 4}
                fill={getDeviceColor(device.type, colors)}
                stroke={device.locked ? colors.warning : isSelected ? colors.primary : colors.muted}
                strokeWidth={device.locked ? 1 : isSelected ? 1 : 0.5}
                shadowBlur={isSelected ? 8 : isHovered ? 5 : 2}
                shadowColor={isSelected ? colors.primary : colors.muted}
                opacity={device.locked ? 0.7 : isSelected ? 1 : isHovered ? 0.95 : 0.9}
                dash={device.locked ? [4, 4] : undefined}
                listening={false}
            />
            {/* Center highlight for selected */}
            {isSelected && (
                <Circle x={0} y={0} radius={2} fill={colors.text} opacity={0.8} listening={false} />
            )}
        </Fragment>
    )
}

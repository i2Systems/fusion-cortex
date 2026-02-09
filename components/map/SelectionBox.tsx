/**
 * Selection Box Component
 *
 * Renders lasso selection rectangle with corner indicators,
 * device highlights, and count breakdown.
 * Extracted from MapCanvas.tsx for modularity.
 */

'use client'

import { Layer, Group, Rect, Circle, Line, Text } from 'react-konva'
import type { DevicePoint, CanvasColors } from './mapTypes'
import { isFixtureType } from '@/lib/deviceUtils'
import { getRgbaVariable, getColorVariable } from '@/lib/canvasColors'

interface SelectionBoxProps {
    selectionStart: { x: number; y: number }
    selectionEnd: { x: number; y: number }
    devices: DevicePoint[]
    colors: CanvasColors
    toCanvasCoords: (point: { x: number; y: number }) => { x: number; y: number }
}

export function SelectionBox({
    selectionStart,
    selectionEnd,
    devices,
    colors,
    toCanvasCoords,
}: SelectionBoxProps) {
    const minX = Math.min(selectionStart.x, selectionEnd.x)
    const maxX = Math.max(selectionStart.x, selectionEnd.x)
    const minY = Math.min(selectionStart.y, selectionEnd.y)
    const maxY = Math.max(selectionStart.y, selectionEnd.y)
    const width = Math.abs(selectionEnd.x - selectionStart.x)
    const height = Math.abs(selectionEnd.y - selectionStart.y)

    // Only render if selection has meaningful size
    if (width < 2 || height < 2) {
        return null
    }

    // Calculate safe corner radius
    const safeCornerRadius = Math.min(4, Math.min(width, height) / 2 - 1)
    const safeCornerRadiusInner = Math.max(0, Math.min(2, Math.min(width - 6, height - 6) / 2 - 1))

    // Find devices within selection box
    const tolerance = 5
    const devicesInSelection = devices.filter((device) => {
        const deviceCoords = toCanvasCoords({ x: device.x, y: device.y })
        return (
            deviceCoords.x >= minX - tolerance &&
            deviceCoords.x <= maxX + tolerance &&
            deviceCoords.y >= minY - tolerance &&
            deviceCoords.y <= maxY + tolerance
        )
    })

    // Count by type
    const fixtures = devicesInSelection.filter((d) => isFixtureType(d.type)).length
    const motion = devicesInSelection.filter((d) => d.type === 'motion').length
    const sensors = devicesInSelection.filter((d) => d.type === 'light-sensor').length
    const totalCount = devicesInSelection.length

    return (
        <Layer>
            <Group>
                {/* Outer glow */}
                <Rect
                    x={minX - 2}
                    y={minY - 2}
                    width={width + 4}
                    height={height + 4}
                    fill="transparent"
                    stroke={getRgbaVariable('--color-primary', 0.4)}
                    strokeWidth={5}
                    listening={false}
                    shadowBlur={20}
                    shadowColor={colors.selectionShadow || getRgbaVariable('--color-primary', 0.9)}
                    cornerRadius={Math.max(0, safeCornerRadius + 1)}
                />

                {/* Main selection box */}
                <Rect
                    x={minX}
                    y={minY}
                    width={width}
                    height={height}
                    fill={colors.selectionFill || getRgbaVariable('--color-primary', 0.25)}
                    stroke={colors.selectionStroke || colors.primary}
                    strokeWidth={4}
                    dash={[12, 6]}
                    listening={false}
                    shadowBlur={25}
                    shadowColor={colors.selectionShadow || colors.primary}
                    cornerRadius={Math.max(0, safeCornerRadius)}
                />

                {/* Inner bright border */}
                {width > 6 && height > 6 && (
                    <Rect
                        x={minX + 3}
                        y={minY + 3}
                        width={width - 6}
                        height={height - 6}
                        fill="transparent"
                        stroke={getColorVariable('--color-canvas-selection-inner', 'rgba(255, 255, 255, 0.8)')}
                        strokeWidth={2}
                        dash={[6, 4]}
                        listening={false}
                        cornerRadius={Math.max(0, safeCornerRadiusInner)}
                    />
                )}

                {/* Corner indicators */}
                <Group>
                    {/* Top-left */}
                    <Line points={[minX, minY, minX + 20, minY]} stroke={colors.selectionStroke || colors.primary} strokeWidth={4} lineCap="round" listening={false} />
                    <Line points={[minX, minY, minX, minY + 20]} stroke={colors.selectionStroke || colors.primary} strokeWidth={4} lineCap="round" listening={false} />
                    {/* Top-right */}
                    <Line points={[maxX, minY, maxX - 20, minY]} stroke={colors.selectionStroke || colors.primary} strokeWidth={4} lineCap="round" listening={false} />
                    <Line points={[maxX, minY, maxX, minY + 20]} stroke={colors.selectionStroke || colors.primary} strokeWidth={4} lineCap="round" listening={false} />
                    {/* Bottom-left */}
                    <Line points={[minX, maxY, minX + 20, maxY]} stroke={colors.selectionStroke || colors.primary} strokeWidth={4} lineCap="round" listening={false} />
                    <Line points={[minX, maxY, minX, maxY - 20]} stroke={colors.selectionStroke || colors.primary} strokeWidth={4} lineCap="round" listening={false} />
                    {/* Bottom-right */}
                    <Line points={[maxX, maxY, maxX - 20, maxY]} stroke={colors.selectionStroke || colors.primary} strokeWidth={4} lineCap="round" listening={false} />
                    <Line points={[maxX, maxY, maxX, maxY - 20]} stroke={colors.selectionStroke || colors.primary} strokeWidth={4} lineCap="round" listening={false} />
                </Group>

                {/* Device indicators */}
                {devicesInSelection.map((device) => {
                    const deviceCoords = toCanvasCoords({ x: device.x, y: device.y })
                    const color = isFixtureType(device.type)
                        ? colors.fixture || colors.primary
                        : device.type === 'motion'
                            ? colors.accent
                            : colors.success

                    return (
                        <Group key={device.id}>
                            <Circle x={deviceCoords.x} y={deviceCoords.y} radius={12} fill="transparent" stroke={color} strokeWidth={3} opacity={0.6} listening={false} shadowBlur={15} shadowColor={color} />
                            <Circle x={deviceCoords.x} y={deviceCoords.y} radius={10} fill={color} opacity={0.5} listening={false} />
                            <Circle x={deviceCoords.x} y={deviceCoords.y} radius={8} fill="transparent" stroke={color} strokeWidth={3} listening={false} />
                            <Circle x={deviceCoords.x} y={deviceCoords.y} radius={4} fill={color} listening={false} />
                        </Group>
                    )
                })}

                {/* Count indicator */}
                <Group x={minX + 10} y={Math.max(10, minY - 60)}>
                    <Rect
                        x={0}
                        y={0}
                        width={Math.max(160, 100 + (totalCount > 9 ? 20 : 0))}
                        height={totalCount > 0 ? 60 : 35}
                        fill={colors.tooltipBg}
                        cornerRadius={8}
                        listening={false}
                        shadowBlur={25}
                        shadowColor={getRgbaVariable('--color-tooltip-shadow', 0.7, 'rgba(0, 0, 0, 0.7)')}
                    />
                    <Rect
                        x={0}
                        y={0}
                        width={Math.max(160, 100 + (totalCount > 9 ? 20 : 0))}
                        height={totalCount > 0 ? 60 : 35}
                        fill="transparent"
                        stroke={colors.selectionStroke || colors.primary}
                        strokeWidth={3}
                        cornerRadius={8}
                        listening={false}
                    />
                    <Text
                        x={10}
                        y={8}
                        text={totalCount > 0 ? `${totalCount} device${totalCount !== 1 ? 's' : ''} selected` : 'Drag to select devices'}
                        fontSize={13}
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontStyle="bold"
                        fill={totalCount > 0 ? colors.text : getRgbaVariable('--color-text', 0.7)}
                        align="left"
                        listening={false}
                    />
                    {totalCount > 0 && (
                        <Group x={8} y={22}>
                            {fixtures > 0 && (
                                <Text x={0} y={0} text={`• ${fixtures} fixture${fixtures !== 1 ? 's' : ''}`} fontSize={10} fontFamily="system-ui, -apple-system, sans-serif" fill={colors.fixture || colors.primary} align="left" listening={false} />
                            )}
                            {motion > 0 && (
                                <Text x={0} y={fixtures > 0 ? 14 : 0} text={`• ${motion} motion sensor${motion !== 1 ? 's' : ''}`} fontSize={10} fontFamily="system-ui, -apple-system, sans-serif" fill={colors.accent} align="left" listening={false} />
                            )}
                            {sensors > 0 && (
                                <Text x={0} y={(fixtures > 0 ? 14 : 0) + (motion > 0 ? 14 : 0)} text={`• ${sensors} light sensor${sensors !== 1 ? 's' : ''}`} fontSize={10} fontFamily="system-ui, -apple-system, sans-serif" fill={colors.success} align="left" listening={false} />
                            )}
                        </Group>
                    )}
                </Group>
            </Group>
        </Layer>
    )
}

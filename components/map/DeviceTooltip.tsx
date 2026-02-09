/**
 * Device Tooltip Component
 *
 * Shows device information when hovering over a device.
 * Displays type, serial, signal, status, zone, and components preview.
 * Extracted from MapCanvas.tsx for modularity.
 */

'use client'

import { Group, Rect, Text, Line } from 'react-konva'
import type { DevicePoint, CanvasColors } from './mapTypes'

interface DeviceTooltipProps {
    device: DevicePoint
    deviceData: any
    position: { x: number; y: number }
    dimensions: { width: number; height: number }
    colors: CanvasColors
}

export function DeviceTooltip({
    device,
    deviceData,
    position,
    dimensions,
    colors,
}: DeviceTooltipProps) {
    // Calculate tooltip dimensions based on content
    const componentsCount = deviceData.components?.length || 0
    const hasComponents = componentsCount > 0
    const tooltipWidth = 300
    const padding = 16
    const lineHeight = 18
    const sectionSpacing = 8

    // Calculate base info lines
    const deviceInfoLines = [
        `Type: ${device.type}`,
        `Serial: ${deviceData.serialNumber}`,
        `Signal: ${device.signal}%`,
        `Status: ${device.status}`,
        ...(device.locked ? ['🔒 Locked'] : []),
        ...(device.location ? [`Location: ${device.location}`] : []),
        ...(deviceData.zone ? [`Zone: ${deviceData.zone}`] : []),
    ]

    // Estimate text wrapping for long strings
    const maxTextWidth = tooltipWidth - padding * 2
    const estimateWrappedLines = (text: string, fontSize: number) => {
        const charsPerLine = Math.floor(maxTextWidth / (fontSize * 0.6))
        return Math.max(1, Math.ceil(text.length / charsPerLine))
    }

    let deviceInfoHeight = 0
    deviceInfoLines.forEach((line) => {
        const wrappedLines = estimateWrappedLines(line, 12)
        deviceInfoHeight += wrappedLines * lineHeight
    })

    // Header + divider + spacing
    const headerHeight = 40
    const dividerHeight = 2
    const baseHeight = headerHeight + dividerHeight + sectionSpacing + deviceInfoHeight + sectionSpacing

    // Components section height
    const componentsHeaderHeight = 20
    const componentsListHeight = hasComponents
        ? Math.min(componentsCount, 5) * 20 + (componentsCount > 5 ? 20 : 0)
        : 0
    const componentsHeight = hasComponents
        ? componentsHeaderHeight + componentsListHeight + sectionSpacing
        : 0

    const totalHeight = baseHeight + componentsHeight + padding * 2

    // Calculate position to keep tooltip within viewport
    const tooltipX = Math.max(
        padding,
        Math.min(position.x + 20, dimensions.width - tooltipWidth - padding)
    )
    const tooltipY = Math.max(padding, Math.min(position.y - 10, dimensions.height - totalHeight - padding))

    return (
        <Group x={tooltipX} y={tooltipY}>
            {/* Tooltip background */}
            <Rect
                width={tooltipWidth}
                height={totalHeight}
                fill={colors.tooltipBg}
                cornerRadius={10}
                listening={false}
                shadowBlur={20}
                shadowColor={colors.tooltipShadow}
                shadowOffsetX={0}
                shadowOffsetY={4}
                opacity={0.98}
            />
            {/* Border */}
            <Rect
                width={tooltipWidth}
                height={totalHeight}
                fill="transparent"
                stroke={colors.tooltipBorder}
                strokeWidth={2}
                cornerRadius={10}
                listening={false}
            />

            {/* Header */}
            <Text
                x={padding}
                y={padding}
                text={device.deviceId}
                fontSize={16}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontStyle="bold"
                fill={colors.tooltipText}
                align="left"
                listening={false}
                width={tooltipWidth - padding * 2}
                wrap="word"
            />

            {/* Divider */}
            <Line
                points={[padding, padding + 24, tooltipWidth - padding, padding + 24]}
                stroke={colors.tooltipBorder}
                strokeWidth={1}
                opacity={0.3}
                listening={false}
            />

            {/* Device info lines */}
            {deviceInfoLines.map((line, idx) => {
                const yPos = padding + headerHeight + dividerHeight + sectionSpacing + idx * lineHeight
                return (
                    <Text
                        key={idx}
                        x={padding}
                        y={yPos}
                        text={line}
                        fontSize={12}
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontStyle="normal"
                        fill={colors.tooltipText}
                        align="left"
                        listening={false}
                        width={tooltipWidth - padding * 2}
                        wrap="word"
                        lineHeight={1.5}
                    />
                )
            })}

            {/* Components section */}
            {hasComponents && (
                <>
                    <Line
                        points={[padding, baseHeight - sectionSpacing, tooltipWidth - padding, baseHeight - sectionSpacing]}
                        stroke={colors.tooltipBorder}
                        strokeWidth={1}
                        opacity={0.2}
                        listening={false}
                    />
                    <Text
                        x={padding}
                        y={baseHeight}
                        text={`Components (${componentsCount}):`}
                        fontSize={11}
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontStyle="bold"
                        fill={colors.tooltipText}
                        align="left"
                        listening={false}
                        opacity={0.9}
                    />
                    {deviceData.components?.slice(0, 5).map((component: any, idx: number) => (
                        <Text
                            key={component.id}
                            x={padding + 4}
                            y={baseHeight + componentsHeaderHeight + idx * 20}
                            text={`• ${component.componentType}`}
                            fontSize={11}
                            fontFamily="system-ui, -apple-system, sans-serif"
                            fontStyle="normal"
                            fill={colors.muted}
                            align="left"
                            listening={false}
                            width={tooltipWidth - padding * 2 - 4}
                            wrap="word"
                        />
                    ))}
                    {componentsCount > 5 && (
                        <Text
                            x={padding + 4}
                            y={baseHeight + componentsHeaderHeight + 5 * 20}
                            text={`...and ${componentsCount - 5} more`}
                            fontSize={10}
                            fontFamily="system-ui, -apple-system, sans-serif"
                            fontStyle="italic"
                            fill={colors.muted}
                            align="left"
                            listening={false}
                            opacity={0.7}
                        />
                    )}
                </>
            )}
        </Group>
    )
}

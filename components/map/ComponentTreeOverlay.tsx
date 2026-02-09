/**
 * Component Tree Overlay
 *
 * Shows expanded component tree for a device.
 * Displays warranty status and allows clicking to view component details.
 * Extracted from MapCanvas.tsx for modularity.
 */

'use client'

import { Group, Rect, Text, Line, Circle } from 'react-konva'
import type { Component } from '@/lib/mockData'
import type { CanvasColors } from './mapTypes'
import { getRgbaVariable } from '@/lib/canvasColors'

interface ComponentTreeOverlayProps {
    deviceId: string
    components: Component[]
    colors: CanvasColors
    devicesData: any[]
    onComponentClick?: (component: Component, parentDevice: any) => void
}

export function ComponentTreeOverlay({
    deviceId,
    components,
    colors,
    devicesData,
    onComponentClick,
}: ComponentTreeOverlayProps) {
    const parentDevice = devicesData.find((d) => d.id === deviceId)

    return (
        <Group x={25} y={-40}>
            <Rect
                width={280}
                height={Math.min(300, 60 + components.length * 80)}
                fill={colors.tooltipBg}
                cornerRadius={8}
                shadowBlur={15}
                shadowColor={colors.tooltipShadow}
                shadowOffsetX={0}
                shadowOffsetY={2}
            />
            <Rect
                width={280}
                height={Math.min(300, 60 + components.length * 80)}
                fill="transparent"
                stroke={colors.tooltipBorder}
                strokeWidth={2}
                cornerRadius={8}
            />
            <Text
                x={14}
                y={14}
                text="Components"
                fontSize={14}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontStyle="bold"
                fill={colors.tooltipText}
                align="left"
            />
            <Line
                points={[14, 32, 266, 32]}
                stroke={colors.tooltipBorder}
                strokeWidth={1}
                opacity={0.3}
            />
            {components.map((component, idx) => {
                const yPos = 40 + idx * 70
                const warrantyColor =
                    component.warrantyStatus === 'Active'
                        ? colors.success
                        : component.warrantyStatus === 'Expired'
                            ? colors.danger
                            : colors.muted

                const handleComponentClick = (e: any) => {
                    e.cancelBubble = true
                    if (onComponentClick && parentDevice) {
                        onComponentClick(component, parentDevice)
                    }
                }

                return (
                    <Group key={component.id} y={yPos} onClick={handleComponentClick} onTap={handleComponentClick}>
                        {/* Clickable background highlight on hover */}
                        <Rect
                            x={0}
                            y={0}
                            width={266}
                            height={65}
                            fill={onComponentClick ? getRgbaVariable('--color-primary', 0.05) : 'transparent'}
                            cornerRadius={4}
                            opacity={0}
                            onMouseEnter={(e) => {
                                if (onComponentClick) {
                                    const rect = e.target
                                    rect.opacity(0.1)
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (onComponentClick) {
                                    const rect = e.target
                                    rect.opacity(0)
                                }
                            }}
                        />
                        <Text
                            x={14}
                            y={0}
                            text={component.componentType}
                            fontSize={12}
                            fontFamily="system-ui, -apple-system, sans-serif"
                            fontStyle="bold"
                            fill={colors.tooltipText}
                            align="left"
                        />
                        <Text
                            x={14}
                            y={16}
                            text={component.componentSerialNumber}
                            fontSize={10}
                            fontFamily="monospace"
                            fill={colors.muted}
                            align="left"
                        />
                        {component.warrantyStatus && (
                            <Group x={14} y={32}>
                                <Circle x={6} y={6} radius={4} fill={warrantyColor} />
                                <Text
                                    x={16}
                                    y={0}
                                    text={`Warranty: ${component.warrantyStatus}`}
                                    fontSize={10}
                                    fontFamily="system-ui, -apple-system, sans-serif"
                                    fill={warrantyColor}
                                    align="left"
                                />
                            </Group>
                        )}
                        {component.warrantyExpiry && (
                            <Text
                                x={14}
                                y={48}
                                text={`Expires: ${component.warrantyExpiry.toLocaleDateString()}`}
                                fontSize={9}
                                fontFamily="system-ui, -apple-system, sans-serif"
                                fill={colors.muted}
                                align="left"
                            />
                        )}
                    </Group>
                )
            })}
        </Group>
    )
}

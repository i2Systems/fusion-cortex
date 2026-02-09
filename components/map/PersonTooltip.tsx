/**
 * Person Tooltip Component
 *
 * Shows person information when hovering over a person token.
 * Two-tier: basic info immediately, detailed info after 700ms.
 * Extracted from MapCanvas.tsx for modularity.
 */

'use client'

import { Group, Rect, Text, Circle } from 'react-konva'
import type { PersonPoint, CanvasColors } from './mapTypes'
import { getRgbaVariable } from '@/lib/canvasColors'

interface PersonTooltipProps {
    person: PersonPoint
    tier: 1 | 2
    position: { x: number; y: number }
    dimensions: { width: number; height: number }
    colors: CanvasColors
}

export function PersonTooltip({
    person,
    tier,
    position,
    dimensions,
    colors,
}: PersonTooltipProps) {
    const tier2 = tier === 2
    const pad = 12
    const lineH = 16
    const nameH = 16
    const roleH = tier2 && person.role ? lineH : 0
    const emailH = tier2 && person.email ? lineH : 0
    const placedH = tier2 ? lineH : 0
    const hintH = 14
    const th = pad * 2 + nameH + (roleH ? roleH + 2 : 0) + (emailH ? emailH + 2 : 0) + (placedH ? placedH + 2 : 0) + 6 + hintH
    const tw = tier2 ? 240 : 200

    const x = Math.max(pad, Math.min(position.x + 14, dimensions.width - tw - pad))
    const y = Math.max(pad, Math.min(position.y - 8, dimensions.height - th - pad))
    const name = [person.firstName, person.lastName].filter(Boolean).join(' ') || 'Person'

    return (
        <Group key="person-tooltip" x={x} y={y}>
            <Rect
                width={tw}
                height={th}
                fill={colors.tooltipBg}
                cornerRadius={10}
                listening={false}
                shadowBlur={20}
                shadowColor={colors.tooltipShadow}
                opacity={0.98}
            />
            <Rect
                width={tw}
                height={th}
                fill="transparent"
                stroke={colors.tooltipBorder}
                strokeWidth={1.5}
                cornerRadius={10}
                listening={false}
            />
            <Text
                x={pad + 32}
                y={pad}
                text={name}
                fontSize={13}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontStyle="bold"
                fill={colors.tooltipText}
                width={tw - pad * 2 - 32}
                wrap="none"
                ellipsis={true}
                listening={false}
            />
            <Text
                x={pad + 32}
                y={th - pad - hintH}
                text="Click to view profile"
                fontSize={10}
                fontFamily="system-ui, -apple-system, sans-serif"
                fill={colors.muted}
                listening={false}
            />
            {tier2 && person.role && (
                <Text
                    x={pad + 32}
                    y={pad + nameH + 2}
                    text={person.role}
                    fontSize={11}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fill={colors.muted}
                    width={tw - pad * 2 - 32}
                    wrap="none"
                    ellipsis={true}
                    listening={false}
                />
            )}
            {tier2 && person.email && (
                <Text
                    x={pad + 32}
                    y={pad + nameH + 2 + roleH + 2}
                    text={person.email}
                    fontSize={10}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fill={colors.muted}
                    width={tw - pad * 2 - 32}
                    wrap="none"
                    ellipsis={true}
                    listening={false}
                />
            )}
            {tier2 && (
                <Text
                    x={pad + 32}
                    y={pad + nameH + 2 + roleH + 2 + emailH + 2}
                    text="Placed on map"
                    fontSize={10}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fill={colors.muted}
                    listening={false}
                />
            )}
            <Circle
                x={pad + 14}
                y={pad + (tier2 ? 28 : 18)}
                radius={12}
                fill={getRgbaVariable('--color-primary', 0.35)}
                stroke={colors.tooltipBorder}
                strokeWidth={1}
                listening={false}
            />
        </Group>
    )
}

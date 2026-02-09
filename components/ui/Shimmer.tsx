/**
 * Shimmer Loading Effects
 * 
 * Reusable shimmer/glimmer components for loading states.
 * Provides a subtle, modern loading animation.
 */

'use client'

import { CSSProperties, ReactNode } from 'react'

// CSS keyframes for shimmer effect
const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
@keyframes textShimmer {
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`

// Inject keyframes once
let keyframesInjected = false
if (typeof document !== 'undefined' && !keyframesInjected) {
    const style = document.createElement('style')
    style.textContent = shimmerKeyframes
    document.head.appendChild(style)
    keyframesInjected = true
}

interface ShimmerProps {
    /** Width of the shimmer placeholder */
    width?: string | number
    /** Height of the shimmer placeholder */
    height?: string | number
    /** Border radius */
    borderRadius?: string | number
    /** Additional class names */
    className?: string
    /** Animation duration in seconds */
    duration?: number
}

/**
 * Shimmer - A rectangular shimmer placeholder
 * Use for content that's loading (cards, images, etc.)
 */
export function Shimmer({
    width = '100%',
    height = 16,
    borderRadius = 4,
    className = '',
    duration = 1.5,
}: ShimmerProps) {
    return (
        <div
            className={`overflow-hidden ${className}`}
            style={{
                width,
                height,
                borderRadius,
                background: 'linear-gradient(90deg, var(--color-surface-subtle) 25%, var(--color-border-subtle) 50%, var(--color-surface-subtle) 75%)',
                backgroundSize: '200% 100%',
                animation: `shimmer ${duration}s infinite ease-in-out`,
            }}
        />
    )
}

interface TextShimmerProps {
    /** Text content to show with shimmer effect */
    children: ReactNode
    /** Whether shimmer is active (loading) */
    isLoading?: boolean
    /** Additional class names */
    className?: string
    /** Animation duration in seconds */
    duration?: number
    /** Custom style overrides */
    style?: CSSProperties
}

/**
 * TextShimmer - Text with a glimmering loading effect
 * Shows a shimmer sweep across the text while loading
 */
export function TextShimmer({
    children,
    isLoading = true,
    className = '',
    duration = 2,
    style,
}: TextShimmerProps) {
    if (!isLoading) {
        return <span className={className} style={style}>{children}</span>
    }

    return (
        <span
            className={className}
            style={{
                ...style,
                background: 'linear-gradient(90deg, currentColor 0%, var(--color-primary) 50%, currentColor 100%)',
                backgroundSize: '200% 100%',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: `textShimmer ${duration}s infinite ease-in-out`,
            }}
        >
            {children}
        </span>
    )
}

interface SkeletonTextProps {
    /** Number of lines to show */
    lines?: number
    /** Width of the last line (percentage or px) */
    lastLineWidth?: string
    /** Line height */
    lineHeight?: number
    /** Gap between lines */
    gap?: number
    /** Additional class names */
    className?: string
}

/**
 * SkeletonText - Multiple shimmer lines for text placeholders
 */
export function SkeletonText({
    lines = 3,
    lastLineWidth = '60%',
    lineHeight = 14,
    gap = 8,
    className = '',
}: SkeletonTextProps) {
    return (
        <div className={`flex flex-col ${className}`} style={{ gap }}>
            {Array.from({ length: lines }).map((_, i) => (
                <Shimmer
                    key={i}
                    height={lineHeight}
                    width={i === lines - 1 ? lastLineWidth : '100%'}
                    borderRadius={4}
                />
            ))}
        </div>
    )
}

interface LoadingDotsProps {
    /** Size of dots */
    size?: number
    /** Color of dots */
    color?: string
    /** Additional class names */
    className?: string
}

/**
 * LoadingDots - Animated loading dots (...)
 */
export function LoadingDots({
    size = 4,
    color = 'currentColor',
    className = '',
}: LoadingDotsProps) {
    return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    style={{
                        width: size,
                        height: size,
                        borderRadius: '50%',
                        backgroundColor: color,
                        animation: `shimmer 1.4s infinite ease-in-out`,
                        animationDelay: `${i * 0.16}s`,
                        opacity: 0.4,
                    }}
                />
            ))}
        </span>
    )
}

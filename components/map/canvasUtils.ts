/**
 * Canvas Utilities
 * 
 * Coordinate conversion and sizing utilities for map canvas rendering.
 * Extracted from MapCanvas.tsx for reusability.
 */

import type { ImageBounds, CanvasColors } from './mapTypes'
import type { Location } from '@/lib/locationStorage'
import { getCanvasColors as getCanvasColorsFromLib } from '@/lib/canvasColors'

/**
 * Get fixture size multiplier based on fixture type
 * 8ft = 1x (base size)
 * 12ft = 1.5x
 * 16ft = 2x
 */
export function getFixtureSizeMultiplier(fixtureType: string): number {
    if (fixtureType.includes('16ft')) return 2.0
    if (fixtureType.includes('12ft')) return 1.5
    if (fixtureType.includes('8ft')) return 1.0
    return 1.0 // Default to 8ft size
}

/**
 * Calculate effective image bounds that account for zoom/crop
 * This logic mirrors FloorPlanImage's zoom rendering to ensure devices align with the zoomed map
 */
export function getEffectiveImageBounds(
    imageBounds: ImageBounds | null,
    dimensions: { width: number; height: number },
    currentLocation?: Location | null
): ImageBounds | null {
    // If no raw bounds or no zoom bounds, just use the raw bounds (normal behavior)
    if (!imageBounds) return null
    if (!currentLocation?.zoomBounds || !currentLocation?.type || currentLocation.type !== 'zoom') {
        return imageBounds
    }

    // Check if zoomBounds is valid object
    const zoomBounds = currentLocation.zoomBounds as {
        minX: number
        minY: number
        maxX: number
        maxY: number
    }
    if (!zoomBounds || typeof zoomBounds.minX !== 'number') return imageBounds

    // We have a Zoom View. We need to calculate where the "Full Image" would be
    // if it were drawn such that the "Zoom Crop" fits perfectly in the canvas.

    // 1. Calculate dimensions of the crop in the original image coordinate space
    const cropWidth = (zoomBounds.maxX - zoomBounds.minX) * imageBounds.width
    const cropHeight = (zoomBounds.maxY - zoomBounds.minY) * imageBounds.height

    // 2. Calculate scale to fit the crop into the canvas
    // Note: FloorPlanImage uses the same logic (aspect fit)
    const scaleX = dimensions.width / cropWidth
    const scaleY = dimensions.height / cropHeight
    const scale = Math.min(scaleX, scaleY)

    // 3. Calculate dimension of the *cropped area* as rendered on canvas
    const scaledWidth = cropWidth * scale
    const scaledHeight = cropHeight * scale

    // 4. Calculate offset to center the cropped area in the canvas
    const cropOffsetX = (dimensions.width - scaledWidth) / 2
    const cropOffsetY = (dimensions.height - scaledHeight) / 2

    // 5. Calculate the effective width/height of the FULL image if it were rendered at this scale
    const effectiveFullWidth = scaledWidth / (zoomBounds.maxX - zoomBounds.minX)
    const effectiveFullHeight = scaledHeight / (zoomBounds.maxY - zoomBounds.minY)

    // 6. Calculate the effective X/Y origin of the FULL image
    // The crop starts at `canvasX = cropOffsetX`
    // The crop starts at `normalizedX = minX` in the image
    // So `cropOffsetX = effectiveX + minX * effectiveFullWidth`
    const effectiveX = cropOffsetX - zoomBounds.minX * effectiveFullWidth
    const effectiveY = cropOffsetY - zoomBounds.minY * effectiveFullHeight

    return {
        x: effectiveX,
        y: effectiveY,
        width: effectiveFullWidth,
        height: effectiveFullHeight,
        naturalWidth: imageBounds.naturalWidth,
        naturalHeight: imageBounds.naturalHeight,
    }
}

/**
 * Create coordinate conversion functions based on image bounds
 */
export function createCoordinateConverters(
    imageBounds: ImageBounds | null,
    dimensions: { width: number; height: number },
    currentLocation?: Location | null
) {
    const getEffectiveBounds = () => getEffectiveImageBounds(imageBounds, dimensions, currentLocation)

    /**
     * Convert normalized coordinates (0-1) to canvas coordinates
     */
    const toCanvasCoords = (point: { x: number; y: number }) => {
        const bounds = getEffectiveBounds()
        if (bounds) {
            return {
                x: bounds.x + point.x * bounds.width,
                y: bounds.y + point.y * bounds.height,
            }
        } else {
            // Fallback to canvas dimensions if image bounds not available
            return {
                x: point.x * dimensions.width,
                y: point.y * dimensions.height,
            }
        }
    }

    /**
     * Convert canvas coordinates back to normalized coordinates (0-1)
     */
    const fromCanvasCoords = (point: { x: number; y: number }) => {
        const bounds = getEffectiveBounds()
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
    }

    return { toCanvasCoords, fromCanvasCoords, getEffectiveBounds }
}

/**
 * Get device color based on type
 */
export function getDeviceColor(type: string, colors: CanvasColors): string {
    // Use darker fixture color for all fixture types
    if (type.startsWith('fixture-')) {
        return colors.fixture
    }
    switch (type) {
        case 'fixture':
            return colors.fixture
        case 'motion':
            return colors.accent
        case 'light-sensor':
            return colors.success
        default:
            return colors.muted
    }
}

/** Re-export canvas colors utility */
export { getCanvasColorsFromLib as getCanvasColors }

/**
 * Vector Floor Plan Component
 * 
 * Renders extracted vector data (paths, lines, text) from PDFs
 * Uses Konva shapes for crisp vector rendering at any zoom level
 */

'use client'

import { useMemo, memo } from 'react'
import { Group, Line, Rect, Text as KonvaText } from 'react-konva'
import type { ExtractedVectorData } from '@/lib/pdfVectorExtractor'

interface VectorFloorPlanProps {
  vectorData: ExtractedVectorData
  width: number
  height: number
  opacity?: number
  showWalls?: boolean
  showAnnotations?: boolean
  showText?: boolean
  zoomBounds?: { minX: number; minY: number; maxX: number; maxY: number } | null
}

export const VectorFloorPlan = memo(function VectorFloorPlan({ 
  vectorData, 
  width, 
  height, 
  opacity = 1.0,
  showWalls = true,
  showAnnotations = true,
  showText = true,
  zoomBounds
}: VectorFloorPlanProps) {
  // Calculate scale to fit vector data into canvas
  // PDF coordinates are in points (1/72 inch), bounds are in points
  // Canvas dimensions are in pixels
  // Scale converts from PDF points to canvas pixels
  
  // Validate bounds and provide fallbacks
  const boundsWidth = vectorData.bounds?.width || 1000
  const boundsHeight = vectorData.bounds?.height || 1000
  const boundsX = 0 // PDF bounds typically start at 0,0
  const boundsY = 0
  
  // Prevent division by zero
  if (boundsWidth <= 0 || boundsHeight <= 0) {
    console.warn('Invalid vector data bounds, using fallback values')
    return null
  }
  
  const scaleX = width / boundsWidth
  const scaleY = height / boundsHeight
  const scale = Math.min(scaleX, scaleY)
  
  // Debug: Log actual values once
  if (typeof window !== 'undefined' && !(window as any).__vectorDebugLogged) {
    console.log('[VectorFloorPlan DEBUG]', {
      canvasWidth: width,
      canvasHeight: height,
      pdfWidth: boundsWidth,
      pdfHeight: boundsHeight,
      scale,
      sampleFontSize: 3,
      renderedFontSize: 3 * scale, // What a 3pt visual height renders as (no more /3 hack)
      devicePixelRatio: window.devicePixelRatio
    });
    (window as any).__vectorDebugLogged = true;
  }
  
  // Center the drawing
  const offsetX = (width - boundsWidth * scale) / 2
  const offsetY = (height - boundsHeight * scale) / 2
  
  // Calculate zoom transform if zoom bounds are provided
  const zoomTransform = useMemo(() => {
    if (!zoomBounds) return null
    
    // Calculate the zoom area in PDF coordinates (normalized 0-1 to actual bounds)
    const zoomMinX = boundsX + zoomBounds.minX * boundsWidth
    const zoomMinY = boundsY + zoomBounds.minY * boundsHeight
    const zoomWidth = (zoomBounds.maxX - zoomBounds.minX) * boundsWidth
    const zoomHeight = (zoomBounds.maxY - zoomBounds.minY) * boundsHeight
    
    // Calculate new scale to fill canvas with zoom area
    const zoomScaleX = width / zoomWidth
    const zoomScaleY = height / zoomHeight
    const zoomScale = Math.min(zoomScaleX, zoomScaleY)
    
    // Calculate offset to position zoom area
    const zoomOffsetX = (width - zoomWidth * zoomScale) / 2 - (zoomMinX - boundsX) * zoomScale
    const zoomOffsetY = (height - zoomHeight * zoomScale) / 2 - (zoomMinY - boundsY) * zoomScale
    
    return {
      scale: zoomScale,
      offsetX: zoomOffsetX,
      offsetY: zoomOffsetY,
      clipX: 0,
      clipY: 0,
      clipWidth: width,
      clipHeight: height,
    }
  }, [zoomBounds, boundsX, boundsY, boundsWidth, boundsHeight, width, height])
  
  const finalScale = zoomTransform?.scale || scale
  const finalOffsetX = zoomTransform?.offsetX ?? offsetX
  const finalOffsetY = zoomTransform?.offsetY ?? offsetY
  
  // Memoize filtered paths to avoid recalculating on every render
  const filteredPaths = useMemo(() => {
    if (!vectorData.paths || !Array.isArray(vectorData.paths)) {
      return []
    }
    return vectorData.paths.filter(path => {
      const layer = path.layer || 'base_building'
      // Base building = walls/structure (black/dark lines)
      if (layer === 'base_building' || layer === 'walls' || layer === 'structure') return showWalls
      // Annotations = grey lines, dimensions
      if (layer === 'annotations' || layer === 'dimensions') return showAnnotations
      // Grid lines = light grey grid lines
      if (layer === 'grid_lines') return showAnnotations  // Show grid lines with annotations
      // Business marks (what they care about) - show with base building for now
      if (layer === 'business_marks') return showWalls
      return true // Default to showing
    })
  }, [vectorData.paths, showWalls, showAnnotations])
  
  // Memoize filtered texts
  const filteredTexts = useMemo(() => {
    if (!showText) return []
    if (!vectorData.texts || !Array.isArray(vectorData.texts)) {
      return []
    }
    return vectorData.texts
  }, [vectorData.texts, showText])
  
  // Memoize rendered paths to avoid recreating components on every render
  // Use stable keys based on path content to prevent unnecessary rerenders
  const renderPaths = useMemo(() => {
    return filteredPaths.map((path, idx) => {
        // Create stable key from path properties
        const pathKey = `${path.type}-${path.points[0]?.toFixed(1)}-${path.points[1]?.toFixed(1)}-${path.stroke || 'default'}-${idx}`
        
        if (path.type === 'rect' && path.points.length >= 4) {
          const [x, y, w, h] = path.points
          return (
            <Rect
              key={pathKey}
              x={finalOffsetX + x * finalScale}
              y={finalOffsetY + y * finalScale}
              width={w * finalScale}
              height={Math.abs(h * finalScale)}
              stroke={path.stroke || '#000000'}
              fill={path.fill || 'transparent'}
              strokeWidth={(path.strokeWidth || 0.25) * finalScale}
              listening={false}
              perfectDrawEnabled={false}
            />
          )
        } else if (path.type === 'path' && path.points.length >= 4) {
          // Render path as a series of connected lines
          // Handle both simple paths and bezier curves (if present)
          const points = path.points.map((p, i) => {
            if (i % 2 === 0) return finalOffsetX + p * finalScale // x
            return finalOffsetY + p * finalScale // y
          })
          
          // Check if path is closed (first and last points match)
          const isClosed = points.length >= 4 && 
            Math.abs(points[0] - points[points.length - 2]) < 0.1 &&
            Math.abs(points[1] - points[points.length - 1]) < 0.1
          
          return (
            <Line
              key={pathKey}
              points={points}
              stroke={path.stroke || '#000000'}
              fill={path.fill}
              strokeWidth={(path.strokeWidth || 0.25) * finalScale}
              closed={isClosed}
              listening={false}
              perfectDrawEnabled={false}
            />
          )
        } else if (path.type === 'line' && path.points.length >= 4) {
          const points = path.points.map((p, i) => {
            if (i % 2 === 0) return finalOffsetX + p * finalScale // x
            return finalOffsetY + p * finalScale // y
          })
          return (
            <Line
              key={pathKey}
              points={points}
              stroke={path.stroke || '#000000'}
              strokeWidth={(path.strokeWidth || 0.25) * finalScale}
              listening={false}
              perfectDrawEnabled={false}
            />
          )
        }
      return null
    }).filter(Boolean) // Remove null entries
  }, [filteredPaths, finalOffsetX, finalOffsetY, finalScale])
  
  // Render texts - scale font size exactly like coordinates (1:1)
  // Handle rotated text (vertical text in title blocks, etc.)
  // NOTE: Python extraction now provides visual height from bbox as fontSize,
  // so no division factor needed - just scale directly.
  const renderTexts = useMemo(() => {
    // Debug: log first few text items once
    if (typeof window !== 'undefined' && !(window as any).__textDebugLogged && filteredTexts.length > 0) {
      console.log('[Text DEBUG] Sample texts from extraction:', filteredTexts.slice(0, 5).map(t => ({
        text: t.text?.substring(0, 20),
        fontSize: t.fontSize,
        scaledSize: (t.fontSize || 1) * finalScale
      })));
      console.log('[Text DEBUG] Largest fonts:', 
        [...filteredTexts].sort((a, b) => (b.fontSize || 0) - (a.fontSize || 0)).slice(0, 5).map(t => ({
          text: t.text?.substring(0, 20),
          fontSize: t.fontSize,
          scaledSize: (t.fontSize || 1) * finalScale
        })));
      (window as any).__textDebugLogged = true;
    }
    
    return filteredTexts.map((textItem, idx) => {
      // Font size from Python is now the visual height from bbox
      // Just scale it like we scale coordinates - 1:1 mapping
      const baseFontSize = textItem.fontSize || 1
      const fontSize = baseFontSize * finalScale
      
      // Get rotation angle (default 0 = horizontal)
      const rotation = textItem.rotation || 0
      
      // Base position from bbox (top-left corner)
      let x = finalOffsetX + textItem.x * finalScale
      let y = finalOffsetY + textItem.y * finalScale
      
      // For rotated text, Konva rotates around the text origin (top-left)
      // We need to adjust position so the rotated text aligns with bbox
      const isVertical = Math.abs(rotation) > 45 && Math.abs(rotation) < 135
      
      // For vertical text reading bottom-to-top (rotation ~ -90°):
      // After rotation, the text extends upward from origin
      // Need to offset to align with the visual bounding box
      if (isVertical) {
        if (rotation < 0) {
          // Reading bottom-to-top (-90°): offset y by the text width (now vertical)
          y = finalOffsetY + textItem.y * finalScale + fontSize
        }
        // For +90° rotation, the default pivot works reasonably well
      }
      
      return (
        <KonvaText
          key={`text-${textItem.x}-${textItem.y}-${textItem.text.substring(0, 10)}-${idx}`}
          x={x}
          y={y}
          text={textItem.text}
          fontSize={fontSize}
          fontFamily={textItem.fontName || 'Arial'}
          fill="#000000"
          rotation={rotation}
          listening={false}
          perfectDrawEnabled={false}
          hitStrokeWidth={0}
        />
      )
    })
  }, [filteredTexts, finalOffsetX, finalOffsetY, finalScale])
  
  const content = (
    <Group opacity={opacity}>
      {/* White background */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="#ffffff"
        listening={false}
        perfectDrawEnabled={false}
      />
      {/* Render paths/lines - memoized to avoid blocking */}
      {renderPaths}
      {/* Render text labels - memoized */}
      {renderTexts}
    </Group>
  )
  
  // Wrap in clipping group if zoom bounds are provided
  if (zoomTransform) {
    return (
      <Group
        clipX={zoomTransform.clipX}
        clipY={zoomTransform.clipY}
        clipWidth={zoomTransform.clipWidth}
        clipHeight={zoomTransform.clipHeight}
      >
        {content}
      </Group>
    )
  }
  
  return content
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary rerenders
  return (
    prevProps.vectorData === nextProps.vectorData &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.opacity === nextProps.opacity &&
    prevProps.showWalls === nextProps.showWalls &&
    prevProps.showAnnotations === nextProps.showAnnotations &&
    prevProps.showText === nextProps.showText &&
    prevProps.zoomBounds?.minX === nextProps.zoomBounds?.minX &&
    prevProps.zoomBounds?.minY === nextProps.zoomBounds?.minY &&
    prevProps.zoomBounds?.maxX === nextProps.zoomBounds?.maxX &&
    prevProps.zoomBounds?.maxY === nextProps.zoomBounds?.maxY
  )
})


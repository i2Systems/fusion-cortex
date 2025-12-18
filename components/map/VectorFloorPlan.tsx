/**
 * Vector Floor Plan Component
 * 
 * Renders extracted vector data (paths, lines, text) from PDFs
 * Uses Konva shapes for crisp vector rendering at any zoom level
 */

'use client'

import { Group, Line, Rect, Text as KonvaText, Path } from 'react-konva'
import type { ExtractedVectorData } from '@/lib/pdfVectorExtractor'

interface VectorFloorPlanProps {
  vectorData: ExtractedVectorData
  width: number
  height: number
  opacity?: number
}

export function VectorFloorPlan({ vectorData, width, height, opacity = 0.8 }: VectorFloorPlanProps) {
  // Calculate scale to fit vector data into canvas
  const scaleX = width / vectorData.bounds.width
  const scaleY = height / vectorData.bounds.height
  const scale = Math.min(scaleX, scaleY)
  
  // Center the drawing
  const offsetX = (width - vectorData.bounds.width * scale) / 2
  const offsetY = (height - vectorData.bounds.height * scale) / 2
  
  return (
    <Group opacity={opacity}>
      {/* White background */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="#ffffff"
        listening={false}
      />
      {/* Render paths/lines */}
      {vectorData.paths.map((path, idx) => {
        if (path.type === 'rect' && path.points.length >= 4) {
          const [x, y, w, h] = path.points
          return (
            <Rect
              key={`path-${idx}`}
              x={offsetX + x * scale}
              y={offsetY + y * scale}
              width={w * scale}
              height={Math.abs(h * scale)}
              stroke={path.stroke || '#000000'}
              fill={path.fill || 'transparent'}
              strokeWidth={(path.strokeWidth || 1) * scale}
              listening={false}
            />
          )
        } else if (path.type === 'path' && path.points.length >= 4) {
          // Render path as a series of connected lines
          // Handle both simple paths and bezier curves (if present)
          const points = path.points.map((p, i) => {
            if (i % 2 === 0) return offsetX + p * scale // x
            return offsetY + p * scale // y
          })
          
          // Check if path is closed (first and last points match)
          const isClosed = points.length >= 4 && 
            Math.abs(points[0] - points[points.length - 2]) < 0.1 &&
            Math.abs(points[1] - points[points.length - 1]) < 0.1
          
          return (
            <Line
              key={`path-${idx}`}
              points={points}
              stroke={path.stroke || '#000000'}
              fill={path.fill}
              strokeWidth={(path.strokeWidth || 1) * scale}
              closed={isClosed}
              listening={false}
            />
          )
        } else if (path.type === 'line' && path.points.length >= 4) {
          const points = path.points.map((p, i) => {
            if (i % 2 === 0) return offsetX + p * scale // x
            return offsetY + p * scale // y
          })
          return (
            <Line
              key={`line-${idx}`}
              points={points}
              stroke={path.stroke || '#000000'}
              strokeWidth={(path.strokeWidth || 1) * scale}
              listening={false}
            />
          )
        }
        return null
      })}
      
      {/* Render text labels */}
      {vectorData.texts.map((textItem, idx) => (
        <KonvaText
          key={`text-${idx}`}
          x={offsetX + textItem.x * scale}
          y={offsetY + textItem.y * scale}
          text={textItem.text}
          fontSize={textItem.fontSize * scale}
          fontFamily={textItem.fontName}
          fill="#000000"
          listening={false}
        />
      ))}
    </Group>
  )
}


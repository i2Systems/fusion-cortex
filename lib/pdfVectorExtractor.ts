/**
 * PDF Vector Extractor
 * 
 * Extracts vector data (paths, lines, text) from PDFs for vector-first rendering
 * This preserves crisp geometry and enables structured scene graph reconstruction
 * 
 * IMPROVED: Uses canvas rendering + path extraction to capture Form XObject content
 * This approach renders the PDF to canvas, then extracts paths from the rendered output
 */

// Dynamic import to avoid SSR issues
let pdfjsLib: typeof import('pdfjs-dist') | null = null
let workerInitialized = false

export interface ExtractedText {
  x: number
  y: number
  text: string
  fontSize: number
  fontName: string
}

export interface ExtractedPath {
  type: 'line' | 'rect' | 'circle' | 'path'
  points: number[] // [x1, y1, x2, y2, ...] or path commands
  stroke?: string
  fill?: string
  strokeWidth?: number
}

export interface ExtractedVectorData {
  texts: ExtractedText[]
  paths: ExtractedPath[]
  bounds: { width: number; height: number }
  isVector: boolean
}

// Lazy load pdfjs-dist
async function getPdfJs() {
  if (typeof window === 'undefined') {
    throw new Error('PDF utilities can only be used in the browser')
  }
  
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist')
    
    if (!workerInitialized && pdfjsLib.GlobalWorkerOptions) {
      // Use local worker file from public directory (most reliable)
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'
      workerInitialized = true
    }
  }
  
  return pdfjsLib
}

/**
 * Extracts paths from a rendered canvas using image processing
 * This captures ALL rendered content, including Form XObjects
 */
function extractPathsFromCanvas(
  canvas: HTMLCanvasElement,
  viewport: { width: number; height: number }
): ExtractedPath[] {
  const paths: ExtractedPath[] = []
  const ctx = canvas.getContext('2d')
  if (!ctx) return paths
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const width = canvas.width
  const height = canvas.height
  
  // Threshold for detecting black/dark lines (0-255)
  const threshold = 50
  const minLineLength = 3 // Minimum pixels for a line segment
  
  // Scan for horizontal and vertical lines (most common in architectural drawings)
  const visited = new Set<string>()
  
  // Scan for horizontal lines (with gap tolerance for dashed lines)
  const gapTolerance = 3 // Allow small gaps in dashed lines
  for (let y = 0; y < height; y++) {
    let lineStart = -1
    let gapCount = 0
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const brightness = (r + g + b) / 3
      
      if (brightness < threshold) {
        // Dark pixel - part of a line
        gapCount = 0
        if (lineStart === -1) {
          lineStart = x
        }
      } else {
        // Light pixel - potential gap in dashed line
        gapCount++
        if (gapCount > gapTolerance) {
          // Gap too large - end of line
          if (lineStart !== -1 && x - lineStart - gapCount >= minLineLength) {
            const key = `h-${y}-${lineStart}-${x - gapCount}`
            if (!visited.has(key)) {
              visited.add(key)
              paths.push({
                type: 'line',
                points: [lineStart, y, x - gapCount, y],
                stroke: '#000000',
                strokeWidth: 1,
              })
            }
          }
          lineStart = -1
          gapCount = 0
        }
      }
    }
    // Handle line at end of row
    if (lineStart !== -1 && width - lineStart >= minLineLength) {
      const key = `h-${y}-${lineStart}-${width}`
      if (!visited.has(key)) {
        visited.add(key)
        paths.push({
          type: 'line',
          points: [lineStart, y, width, y],
          stroke: '#000000',
          strokeWidth: 1,
        })
      }
    }
  }
  
  // Scan for vertical lines (IMPROVED: Better detection of dashed vertical lines - these are the lights!)
  // Vertical dashed lines are the key pattern for light fixtures in architectural PDFs
  for (let x = 0; x < width; x++) {
    let lineStart = -1
    let gapCount = 0
    let segmentStarts: number[] = []
    let segmentEnds: number[] = []
    
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const brightness = (r + g + b) / 3
      
      if (brightness < threshold) {
        // Dark pixel - part of a line segment
        gapCount = 0
        if (lineStart === -1) {
          lineStart = y
        }
      } else {
        // Light pixel - potential gap
        gapCount++
        if (gapCount > gapTolerance) {
          // Gap too large - end of segment
          if (lineStart !== -1 && y - lineStart - gapCount >= 2) {
            // Store segment (even small segments for dashed lines)
            segmentStarts.push(lineStart)
            segmentEnds.push(y - gapCount)
          }
          lineStart = -1
          gapCount = 0
        }
      }
    }
    // Handle segment at end of column
    if (lineStart !== -1 && height - lineStart >= 2) {
      segmentStarts.push(lineStart)
      segmentEnds.push(height)
    }
    
    // If we have multiple segments on the same X coordinate, it's likely a dashed vertical line (light fixture)
    // Combine segments that are close together into a single line
    if (segmentStarts.length > 0) {
      // Sort segments by start position
      const segments = segmentStarts.map((start, i) => ({ start, end: segmentEnds[i] }))
        .sort((a, b) => a.start - b.start)
      
      // Combine nearby segments (dashed line pattern)
      let combinedStart = segments[0].start
      let combinedEnd = segments[0].end
      
      for (let i = 1; i < segments.length; i++) {
        const gap = segments[i].start - combinedEnd
        if (gap < 10) {
          // Segments are close - combine them
          combinedEnd = segments[i].end
        } else {
          // Gap too large - save current line and start new one
          if (combinedEnd - combinedStart >= minLineLength) {
            const key = `v-${x}-${combinedStart}-${combinedEnd}`
            if (!visited.has(key)) {
              visited.add(key)
              paths.push({
                type: 'line',
                points: [x, combinedStart, x, combinedEnd],
                stroke: '#000000',
                strokeWidth: 1,
              })
            }
          }
          combinedStart = segments[i].start
          combinedEnd = segments[i].end
        }
      }
      
      // Save last combined line
      if (combinedEnd - combinedStart >= minLineLength) {
        const key = `v-${x}-${combinedStart}-${combinedEnd}`
        if (!visited.has(key)) {
          visited.add(key)
          paths.push({
            type: 'line',
            points: [x, combinedStart, x, combinedEnd],
            stroke: '#000000',
            strokeWidth: 1,
          })
        }
      }
    }
  }
  
  // Also scan for diagonal lines and other patterns
  // Use a more sophisticated approach: find connected dark pixels
  const processed = new Uint8Array(width * height)
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      if (processed[idx]) continue
      
      const pixelIdx = idx * 4
      const r = data[pixelIdx]
      const g = data[pixelIdx + 1]
      const b = data[pixelIdx + 2]
      const brightness = (r + g + b) / 3
      
      if (brightness < threshold) {
        // Found a dark pixel - trace the path
        const pathPoints: number[] = []
        const stack: Array<[number, number]> = [[x, y]]
        
        while (stack.length > 0 && pathPoints.length < 1000) {
          const [cx, cy] = stack.pop()!
          const cIdx = cy * width + cx
          
          if (processed[cIdx] || cx < 0 || cx >= width || cy < 0 || cy >= height) {
            continue
          }
          
          const pIdx = cIdx * 4
          const pR = data[pIdx]
          const pG = data[pIdx + 1]
          const pB = data[pIdx + 2]
          const pBrightness = (pR + pG + pB) / 3
          
          if (pBrightness < threshold) {
            processed[cIdx] = 1
            pathPoints.push(cx, cy)
            
            // Check neighbors
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue
                const nx = cx + dx
                const ny = cy + dy
                const nIdx = ny * width + nx
                if (nIdx >= 0 && nIdx < width * height && !processed[nIdx]) {
                  stack.push([nx, ny])
                }
              }
            }
          }
        }
        
        // If we found a significant path, add it
        if (pathPoints.length >= 6) {
          paths.push({
            type: 'path',
            points: pathPoints,
            stroke: '#000000',
            strokeWidth: 1,
          })
        }
      }
    }
  }
  
  return paths
}

/**
 * Extracts vector data from PDF first page
 * NEW APPROACH: Render to canvas at high resolution, then extract paths from rendered output
 * This captures ALL content including Form XObjects
 */
export async function extractVectorData(file: File): Promise<ExtractedVectorData> {
  try {
    const pdfjs = await getPdfJs()
    const arrayBuffer = await file.arrayBuffer()
    
    // Load PDF
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      verbosity: 0,
    })
    const pdf = await loadingTask.promise
    
    // Get first page
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1 })
    
    // Extract text content with proper coordinate transformation
    const textContent = await page.getTextContent()
    const texts: ExtractedText[] = textContent.items
      .filter((item: any) => item.str && item.str.trim())
      .map((item: any) => {
        const transform = item.transform
        return {
          x: transform[4],
          y: viewport.height - transform[5], // Flip Y coordinate
          text: item.str,
          fontSize: Math.abs(transform[0]),
          fontName: item.fontName || 'Arial',
        }
      })
    
    // NEW APPROACH: Render to canvas and extract paths from rendered output
    // This captures everything including Form XObjects
    console.log('Rendering PDF to canvas for path extraction...')
    
    // Render at high resolution for better path detection
    const renderScale = 2
    const renderViewport = page.getViewport({ scale: renderScale })
    
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', {
      alpha: true,
      willReadFrequently: true,
    })
    
    if (!context) {
      throw new Error('Could not get canvas context')
    }
    
    canvas.width = renderViewport.width
    canvas.height = renderViewport.height
    
    // Render PDF page to canvas
    const renderTask = page.render({
      canvasContext: context,
      viewport: renderViewport,
    })
    
    await renderTask.promise
    
    console.log(`Rendered PDF to canvas: ${canvas.width}x${canvas.height}`)
    
    // Extract paths from the rendered canvas
    const paths = extractPathsFromCanvas(canvas, viewport)
    
    // Scale paths back to original viewport size
    const scaleFactor = 1 / renderScale
    const scaledPaths = paths.map(path => ({
      ...path,
      points: path.points.map((p, i) => p * scaleFactor),
      strokeWidth: (path.strokeWidth || 1) * scaleFactor,
    }))
    
    console.log(`Extracted ${scaledPaths.length} paths from rendered canvas`)
    
    // Detect if PDF is vector-based
    const isVector = scaledPaths.length > 0 || texts.length > 10
    
    return {
      texts,
      paths: scaledPaths,
      bounds: {
        width: viewport.width,
        height: viewport.height,
      },
      isVector,
    }
  } catch (error) {
    console.error('Error extracting vector data:', error)
    throw new Error(`Failed to extract vector data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Detects if a PDF is likely vector-based (CAD/architectural drawing)
 */
export async function isVectorPDF(file: File): Promise<boolean> {
  try {
    const data = await extractVectorData(file)
    return data.isVector && (data.texts.length > 5 || data.paths.length > 0)
  } catch {
    return false
  }
}

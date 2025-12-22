/**
 * PDF Utilities
 * 
 * Functions for converting PDF files to images for display in canvas
 * 
 * Note: This module should only be imported in client components ('use client')
 */

// Dynamic import to avoid SSR issues
let pdfjsLib: typeof import('pdfjs-dist') | null = null
let workerInitialized = false

// Lazy load pdfjs-dist only on the client
async function getPdfJs() {
  if (typeof window === 'undefined') {
    throw new Error('PDF utilities can only be used in the browser')
  }
  
  if (!pdfjsLib) {
    try {
      // Dynamic import with better error handling
      const pdfjsModule = await import('pdfjs-dist')
      pdfjsLib = pdfjsModule.default || pdfjsModule
      
      if (!pdfjsLib) {
        throw new Error('pdfjs-dist module is empty or invalid')
      }
      
      // Set up the worker for pdfjs - initialize only once
      if (!workerInitialized && pdfjsLib.GlobalWorkerOptions) {
        // Use local worker file from public directory
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'
        workerInitialized = true
      }
    } catch (importError) {
      console.error('Failed to import pdfjs-dist:', importError)
      const errorMsg = importError instanceof Error ? importError.message : String(importError)
      throw new Error(`Failed to initialize PDF processing library: ${errorMsg}`)
    }
  }
  
  return pdfjsLib
}

/**
 * Converts the first page of a PDF to a high-quality image data URL
 * Preserves all details, text, symbols, and annotations from the PDF
 * This is the most reliable method for complex architectural PDFs with Form XObjects
 * @param file - The PDF file to convert
 * @param scale - Scale factor for rendering (higher = better quality, larger file size). Default: 4 for maximum accuracy
 * @returns Promise resolving to a data URL string of the rendered PDF page
 */
export async function pdfToImage(file: File, scale: number = 6): Promise<string> {
  let pdfjs: typeof import('pdfjs-dist')
  let pdf: any
  let page: any
  
  try {
    pdfjs = await getPdfJs()
  } catch (error) {
    console.error('Failed to load PDF.js library:', error)
    throw new Error('Failed to initialize PDF processing library')
  }
  
  try {
    const arrayBuffer = await file.arrayBuffer()
    
    // Configure PDF loading with worker (now properly configured)
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      verbosity: 0, // Suppress warnings
    })
    
    pdf = await loadingTask.promise
    
    // Get the first page
    try {
      page = await pdf.getPage(1)
    } catch (pageError) {
      console.error('Failed to get PDF page:', pageError)
      throw new Error(`Failed to access PDF page: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`)
    }
    
    // Calculate viewport with higher scale for better quality (especially for architectural drawings)
    // Scale 3 provides excellent quality for detailed floor plans
    const viewport = page.getViewport({ scale })
    
    // Create a canvas to render the PDF page
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', {
      // Enable high-quality rendering
      alpha: true,
      desynchronized: false,
      willReadFrequently: false,
    })
    
    if (!context) {
      throw new Error('Could not get canvas context')
    }
    
    // Set canvas dimensions
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    // Enable high-quality image rendering
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    
    // Render the PDF page to the canvas
    // This preserves all vector graphics, text, symbols, and annotations
    const renderTask = page.render({
      canvasContext: context,
      viewport: viewport,
    })
    
    await renderTask.promise
    
    // Convert canvas to high-quality PNG data URL
    // PNG format preserves all details without loss
    return canvas.toDataURL('image/png', 1.0) // Maximum quality
  } catch (error) {
    // Log the full error for debugging
    console.error('Full PDF conversion error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown')
    
    // Provide detailed error messages
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase()
      
      if (errorMsg.includes('object.defineproperty')) {
        throw new Error('PDF processing library compatibility issue. Please refresh the page and try again.')
      }
      if (errorMsg.includes('invalid pdf') || errorMsg.includes('corrupted')) {
        throw new Error('The PDF file appears to be invalid or corrupted. Please verify the file opens correctly in a PDF viewer.')
      }
      if (errorMsg.includes('worker')) {
        throw new Error('PDF processing worker error. Please try refreshing the page.')
      }
      if (errorMsg.includes('canvas') || errorMsg.includes('context')) {
        throw new Error('Canvas rendering error. Please try a different browser or refresh the page.')
      }
      
      // Return the actual error message for debugging
      throw new Error(`PDF processing failed: ${error.message}`)
    }
    throw new Error('Failed to convert PDF to image: Unknown error occurred')
  }
}

/**
 * Checks if a file is a PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

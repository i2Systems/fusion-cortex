/**
 * PDF Vector Extraction API
 * 
 * - In production (Vercel): Returns error to trigger browser-based extraction
 * - In development: Uses local Python script for better quality
 * 
 * Browser extraction works fine for most cases and is FREE on Vercel.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // In production (Vercel), tell client to use browser extraction
    // This is FREE and works well enough for most PDFs
    const isProduction = process.env.VERCEL === '1'
    
    if (isProduction) {
      return NextResponse.json(
        { 
          error: 'Server extraction not available on Vercel. Using browser extraction.',
          useBrowserFallback: true 
        },
        { status: 503 }
      )
    }
    
    // In development, use local Python for better extraction quality
    return await extractWithLocalPython(file)
  } catch (error) {
    console.error('PDF extraction error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to extract PDF vectors',
        texts: [],
        paths: [],
        bounds: { width: 0, height: 0 },
        isVector: false
      },
      { status: 500 }
    )
  }
}

/**
 * Extract PDF using local Python (development only)
 */
async function extractWithLocalPython(file: File): Promise<NextResponse> {
  const { writeFile, unlink } = await import('fs/promises')
  const { join } = await import('path')
  const { promisify } = await import('util')
  const { exec } = await import('child_process')
  const execAsync = promisify(exec)
  
  // Use /tmp for Vercel compatibility, or local tmp for development
  const tempDir = process.env.VERCEL ? '/tmp' : join(process.cwd(), 'tmp')
  const tempFilePath = join(tempDir, `pdf-${Date.now()}-${file.name}`)
  
  try {
    // Ensure temp directory exists
    const fs = await import('fs')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    // Write file to disk
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await writeFile(tempFilePath, buffer)
    
    // Call Python script with PyMuPDF
    const pythonScript = join(process.cwd(), 'scripts', 'extract_pdf_vectors.py')
    const condaPython = '/Users/powerox/miniconda3/bin/python3'
    const systemPython = 'python3'
    
    // Check which Python to use
    let pythonCmd = systemPython
    try {
      const { execSync } = await import('child_process')
      try {
        execSync(`${condaPython} -c "import fitz"`, { timeout: 2000 })
        pythonCmd = condaPython
        console.log('Using conda Python with PyMuPDF')
      } catch {
        try {
          execSync(`${systemPython} -c "import fitz"`, { timeout: 2000 })
          pythonCmd = systemPython
          console.log('Using system Python with PyMuPDF')
        } catch {
          console.warn('PyMuPDF not found')
        }
      }
    } catch {
      // Fallback
    }
    
    // Write output to temp files
    const outputFile = join(tempDir, `output-${Date.now()}.json`)
    const stderrFile = join(tempDir, `stderr-${Date.now()}.txt`)
    
    await execAsync(
      `"${pythonCmd}" "${pythonScript}" "${tempFilePath}" > "${outputFile}" 2> "${stderrFile}" || true`,
      { 
        timeout: 120000,
        maxBuffer: 1024 * 1024 * 10
      }
    )
    
    // Read output
    let outputContent = ''
    try {
      outputContent = fs.readFileSync(outputFile, 'utf-8')
    } catch (e) {
      throw new Error(`Failed to read output: ${e}`)
    }
    
    // Read stderr for debugging
    try {
      const stderrContent = fs.readFileSync(stderrFile, 'utf-8')
      if (stderrContent) {
        console.log('Python stderr:', stderrContent.substring(0, 500))
      }
    } catch {}
    
    // Cleanup
    await unlink(outputFile).catch(() => {})
    await unlink(stderrFile).catch(() => {})
    await unlink(tempFilePath).catch(() => {})
    
    // Parse JSON
    const jsonStart = outputContent.indexOf('{')
    const jsonEnd = outputContent.lastIndexOf('}') + 1
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No JSON output from Python')
    }
    
    const result = JSON.parse(outputContent.substring(jsonStart, jsonEnd))
    
    console.log(`✅ [Local] Extracted ${result.paths?.length || 0} paths, ${result.texts?.length || 0} texts`)
    
    return NextResponse.json(result)
  } catch (error) {
    await unlink(tempFilePath).catch(() => {})
    throw error
  }
}

export const runtime = 'nodejs'
export const maxDuration = 60

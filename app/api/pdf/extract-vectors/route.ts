/**
 * PDF Vector Extraction API
 * 
 * Server-side API route that uses PyMuPDF (fitz) to extract vector data from PDFs
 * This provides much better extraction than browser-based PDF.js, especially for Form XObjects
 */

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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
    
    // Save uploaded file temporarily
    const tempDir = join(process.cwd(), 'tmp')
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
      // Try to use conda Python if available, otherwise fall back to system python3
      const pythonScript = join(process.cwd(), 'scripts', 'extract_pdf_vectors.py')
      const condaPython = '/Users/powerox/miniconda3/bin/python3'
      const systemPython = 'python3'
      
      // Check if conda Python exists and has PyMuPDF
      let pythonCmd = systemPython
      try {
        const { execSync } = await import('child_process')
        try {
          execSync(`${condaPython} -c "import fitz"`, { timeout: 2000 })
          pythonCmd = condaPython
          console.log('Using conda Python with PyMuPDF')
        } catch {
          // Try system python3
          try {
            execSync(`${systemPython} -c "import fitz"`, { timeout: 2000 })
            pythonCmd = systemPython
            console.log('Using system Python with PyMuPDF')
          } catch {
            console.warn('PyMuPDF not found in either Python, will try anyway')
          }
        }
      } catch {
        // Fallback to system python3
      }
      
      try {
        // Write output to a temp file to avoid stdout buffer limits (257k+ paths = huge JSON)
        const outputFile = join(tempDir, `output-${Date.now()}.json`)
        const stderrFile = join(tempDir, `stderr-${Date.now()}.txt`)
        
        const { stdout, stderr } = await execAsync(
          `"${pythonCmd}" "${pythonScript}" "${tempFilePath}" > "${outputFile}" 2> "${stderrFile}" || true`,
          { 
            timeout: 120000, // 120 second timeout for complex PDFs
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer for stderr only
          }
        )
        
        // Read the output file (JSON)
        const fs = await import('fs')
        let outputContent = ''
        try {
          outputContent = fs.readFileSync(outputFile, 'utf-8')
        } catch (e) {
          throw new Error(`Failed to read output file: ${e}`)
        }
        
        // Read stderr for debugging
        let stderrContent = ''
        try {
          stderrContent = fs.readFileSync(stderrFile, 'utf-8')
          if (stderrContent) {
            console.log('Python script stderr:', stderrContent.substring(0, 1000))
          }
        } catch {
          // stderr file might not exist, that's okay
        }
        
        // Clean up temp files
        await unlink(outputFile).catch(() => {})
        await unlink(stderrFile).catch(() => {})
        
        // Find JSON in output (may have debug messages before it)
        let jsonStart = outputContent.indexOf('{')
        let jsonEnd = outputContent.lastIndexOf('}') + 1
        if (jsonStart === -1 || jsonEnd === 0) {
          throw new Error('No JSON output from Python script. Output: ' + outputContent.substring(0, 500))
        }
        
        const jsonOutput = outputContent.substring(jsonStart, jsonEnd)
        const result = JSON.parse(jsonOutput)
        
        console.log(`✅ Extracted ${result.paths?.length || 0} paths, ${result.texts?.length || 0} texts`)
        
        if (result.error) {
          throw new Error(result.error)
        }
        
        // Clean up temp file
        await unlink(tempFilePath).catch(() => {})
        
        return NextResponse.json(result)
      } catch (execError: any) {
        // Check if PyMuPDF is not installed
        if (execError.stderr?.includes('ModuleNotFoundError') || execError.stderr?.includes('fitz')) {
          await unlink(tempFilePath).catch(() => {})
          return NextResponse.json(
            { 
              error: 'PyMuPDF not installed. Run: pip install PyMuPDF',
              texts: [],
              paths: [],
              bounds: { width: 0, height: 0 },
              isVector: false
            },
            { status: 503 }
          )
        }
        throw execError
      }
    } catch (error) {
      // Clean up temp file on error
      await unlink(tempFilePath).catch(() => {})
      throw error
    }
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

// Route segment config for Next.js App Router
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds for processing


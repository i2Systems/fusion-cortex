/**
 * Generate Seed Files Script
 * 
 * This script generates the seed files from exported JSON data.
 * 
 * Usage:
 * 1. Export your data using exportFusionData() in browser console
 * 2. Save the downloaded JSON file
 * 3. Run: npx tsx lib/generateSeedFiles.ts <path-to-exported-json>
 * 
 * Or use the browser console version (see EXPORT_DATA.md)
 */

import * as fs from 'fs'
import * as path from 'path'

function generateSeedFiles(jsonPath: string) {
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  
  // Generate seedZones.ts
  const zonesContent = `/**
 * Seed Zones Data
 * 
 * This file contains the saved zones configuration.
 * Auto-generated from exported data.
 * 
 * Last updated: ${new Date().toISOString()}
 */

import { Zone } from './ZoneContext'

export const seedZones: Zone[] | null = ${JSON.stringify(jsonData.zones, null, 2)}
`
  
  // Generate seedDevices.ts
  const devicesContent = `/**
 * Seed Devices Data
 * 
 * This file contains the saved devices configuration with positions.
 * Auto-generated from exported data.
 * 
 * Last updated: ${new Date().toISOString()}
 */

import { Device } from './mockData'

export const seedDevices: Device[] | null = ${JSON.stringify(jsonData.devices, null, 2)}
`
  
  const zonesPath = path.join(__dirname, 'seedZones.ts')
  const devicesPath = path.join(__dirname, 'seedDevices.ts')
  
  fs.writeFileSync(zonesPath, zonesContent)
  fs.writeFileSync(devicesPath, devicesContent)
  
  console.log('✅ Generated seedZones.ts')
  console.log('✅ Generated seedDevices.ts')
  console.log(`\n📦 Zones: ${jsonData.zones?.length || 0}`)
  console.log(`📦 Devices: ${jsonData.devices?.length || 0}`)
  console.log('\n💡 Next steps:')
  console.log('   git add lib/seedZones.ts lib/seedDevices.ts')
  console.log('   git commit -m "Update seed data with current zones and device positions"')
  console.log('   git push origin main')
}

// Run if called directly
if (require.main === module) {
  const jsonPath = process.argv[2]
  if (!jsonPath) {
    console.error('Usage: npx tsx lib/generateSeedFiles.ts <path-to-exported-json>')
    process.exit(1)
  }
  generateSeedFiles(jsonPath)
}

export { generateSeedFiles }


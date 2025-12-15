/**
 * Data Export Utility
 * 
 * Use this in the browser console to export your current zones and devices
 * for committing to the repository.
 * 
 * Usage:
 * 1. Open browser console on your local app
 * 2. Copy and paste the export function
 * 3. Run: exportFusionData()
 * 4. Copy the output and save it to seedZones.ts and seedDevices.ts
 */

export function exportFusionData() {
  if (typeof window === 'undefined') {
    console.error('This function must be run in the browser')
    return
  }

  const zones = localStorage.getItem('fusion_zones')
  const devices = localStorage.getItem('fusion_devices')
  const bacnetMappings = localStorage.getItem('fusion_bacnet_mappings')

  const exportData = {
    zones: zones ? JSON.parse(zones) : null,
    devices: devices ? JSON.parse(devices) : null,
    bacnetMappings: bacnetMappings ? JSON.parse(bacnetMappings) : null,
    exportedAt: new Date().toISOString(),
  }

  // Generate TypeScript code for seed files
  const zonesCode = `/**
 * Seed Zones Data
 * 
 * This file contains the saved zones configuration.
 * Auto-generated from exported data.
 * 
 * Last updated: ${new Date().toISOString()}
 */

import { Zone } from './ZoneContext'

export const seedZones: Zone[] | null = ${JSON.stringify(exportData.zones, null, 2)}
`

  const devicesCode = `/**
 * Seed Devices Data
 * 
 * This file contains the saved devices configuration with positions.
 * Auto-generated from exported data.
 * 
 * Last updated: ${new Date().toISOString()}
 */

import { Device } from './mockData'

export const seedDevices: Device[] | null = ${JSON.stringify(exportData.devices, null, 2)}
`

  console.log('%c=== COPY THIS TO lib/seedZones.ts ===', 'color: #4c7dff; font-weight: bold; font-size: 14px;')
  console.log(zonesCode)
  console.log('\n%c=== COPY THIS TO lib/seedDevices.ts ===', 'color: #4c7dff; font-weight: bold; font-size: 14px;')
  console.log(devicesCode)
  
  // Also create downloadable files
  const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const jsonUrl = URL.createObjectURL(jsonBlob)
  const jsonLink = document.createElement('a')
  jsonLink.href = jsonUrl
  jsonLink.download = `fusion-data-export-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(jsonLink)
  jsonLink.click()
  document.body.removeChild(jsonLink)
  URL.revokeObjectURL(jsonUrl)

  // Also create downloadable TypeScript files
  const zonesBlob = new Blob([zonesCode], { type: 'text/typescript' })
  const zonesUrl = URL.createObjectURL(zonesBlob)
  const zonesLink = document.createElement('a')
  zonesLink.href = zonesUrl
  zonesLink.download = 'seedZones.ts'
  document.body.appendChild(zonesLink)
  zonesLink.click()
  document.body.removeChild(zonesLink)
  URL.revokeObjectURL(zonesUrl)

  const devicesBlob = new Blob([devicesCode], { type: 'text/typescript' })
  const devicesUrl = URL.createObjectURL(devicesBlob)
  const devicesLink = document.createElement('a')
  devicesLink.href = devicesUrl
  devicesLink.download = 'seedDevices.ts'
  document.body.appendChild(devicesLink)
  devicesLink.click()
  document.body.removeChild(devicesLink)
  URL.revokeObjectURL(devicesUrl)

  console.log('\n%c✅ Files downloaded! Next steps:', 'color: #22c55e; font-weight: bold;')
  console.log('1. Move seedZones.ts to lib/seedZones.ts')
  console.log('2. Move seedDevices.ts to lib/seedDevices.ts')
  console.log('3. git add lib/seedZones.ts lib/seedDevices.ts')
  console.log('4. git commit -m "Update seed data with current zones and device positions"')
  console.log('5. git push origin main')

  return exportData
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).exportFusionData = exportFusionData
}


/**
 * Site-Specific Mock Data Generator
 * 
 * Generates unique device and zone data for each site.
 * Each site has different device counts, layouts, and characteristics.
 * 
 * AI Note: This creates realistic variation between sites while maintaining
 * the same data structure. Used for initializing site-specific data.
 */

import { Device, DeviceType, DeviceStatus } from './mockData'
import { Zone } from './stores/zoneStore'
import { initialZones } from './initialZones'

export interface SiteData {
    devices: Device[]
    zones: Omit<Zone, 'id' | 'createdAt' | 'updatedAt'>[]
    stats: {
        totalDevices: number
        onlineDevices: number
        offlineDevices: number
        missingDevices: number
        totalZones: number
        healthPercentage: number
    }
}

/**
 * Generate site-specific device data
 * Each site has variations in device count, positioning, and status
 */
function generateSiteDevices(siteId: string, baseCount: number = 120): Device[] {
    const devices: Device[] = []

    // Vary device count per site (±20%)
    const deviceCount = Math.floor(baseCount * (0.8 + Math.random() * 0.4))

    // Site-specific variations
    const siteVariations: Record<string, { multiplier: number; healthOffset: number }> = {
        'site-1234': { multiplier: 1.0, healthOffset: 0 }, // Baseline
        'site-2156': { multiplier: 0.9, healthOffset: -5 }, // Slightly smaller, slightly worse health
        'site-3089': { multiplier: 1.1, healthOffset: 5 }, // Larger, better health
        'site-4421': { multiplier: 0.95, healthOffset: -3 }, // Smaller, slightly worse
        'site-5567': { multiplier: 1.05, healthOffset: 3 }, // Larger, slightly better
    }

    const variation = siteVariations[siteId] || siteVariations['site-1234'] || { multiplier: 1.0, healthOffset: 0 }
    const finalCount = Math.floor(deviceCount * variation.multiplier)

    // Generate devices similar to mockData.ts but with site-specific variations
    const rooms = [
        { x: [0.1, 0.28], y: [0.2, 0.45], name: 'Apparel Top', zone: 'Apparel & Clothing' },
        { x: [0.1, 0.28], y: [0.45, 0.65], name: 'Apparel Center', zone: 'Apparel & Clothing' },
        { x: [0.25, 0.42], y: [0.05, 0.2], name: 'Home Top', zone: 'Home & Garden' },
        { x: [0.42, 0.58], y: [0.05, 0.2], name: 'Electronics Top', zone: 'Electronics & Sporting Goods' },
        { x: [0.6, 0.72], y: [0.05, 0.2], name: 'Produce', zone: 'Grocery & Food' },
        { x: [0.72, 0.88], y: [0.05, 0.2], name: 'Meat & Seafood', zone: 'Grocery & Food' },
        { x: [0.6, 0.88], y: [0.35, 0.55], name: 'Grocery Aisles', zone: 'Grocery & Food' },
    ]

    let deviceCounter = 1
    let serialCounter = 2024 + Math.floor(Math.random() * 1000) // Vary serial numbers

    // Generate fixtures
    for (const room of rooms) {
        const roomWidth = room.x[1] - room.x[0]
        const roomHeight = room.y[1] - room.y[0]
        const targetLights = Math.max(2, Math.floor((roomWidth * roomHeight * 120) * variation.multiplier))
        const cols = Math.max(2, Math.ceil(Math.sqrt(targetLights * (roomWidth / roomHeight))))
        const rows = Math.max(2, Math.ceil(targetLights / cols))

        const padding = 0.02
        const spacingX = cols > 1 ? (roomWidth - padding * 2) / (cols - 1) : 0
        const spacingY = rows > 1 ? (roomHeight - padding * 2) / (rows - 1) : 0

        for (let row = 0; row < rows && devices.length < finalCount - 20; row++) {
            for (let col = 0; col < cols && devices.length < finalCount - 20; col++) {
                const x = room.x[0] + padding + (spacingX * col)
                const y = room.y[0] + padding + (spacingY * row)

                // Health variation based on site
                const healthRand = Math.random()
                const healthThreshold = 0.05 + (variation.healthOffset / 100) // Adjust based on site
                const status: DeviceStatus = healthRand > healthThreshold ? 'online' :
                    healthRand > healthThreshold * 0.5 ? 'offline' : 'missing'

                const signal = status === 'online'
                    ? Math.floor(Math.random() * 40) + 50
                    : Math.floor(Math.random() * 30)

                const fixtureSerial = `SN-2024-${String(serialCounter++).padStart(4, '0')}-F${String(Math.floor(Math.random() * 9) + 1)}`
                const fixtureId = `device-${deviceCounter++}`

                devices.push({
                    id: `${siteId}-${fixtureId}`,
                    deviceId: `FLX-${String(serialCounter - 1).padStart(4, '0')}`,
                    serialNumber: fixtureSerial,
                    type: 'fixture-16ft-power-entry',
                    signal,
                    status,
                    location: room.name,
                    zone: room.zone,
                    x: Math.max(room.x[0] + 0.005, Math.min(room.x[1] - 0.005, x)),
                    y: Math.max(room.y[0] + 0.005, Math.min(room.y[1] - 0.005, y)),
                    orientation: Math.random() * 360,
                })
            }
        }
    }

    // Add some motion sensors and light sensors
    for (let i = 0; i < 15 && devices.length < finalCount; i++) {
        const type: DeviceType = i < 10 ? 'motion' : 'light-sensor'
        const battery = type === 'motion' ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 30) + 70
        const status: DeviceStatus = battery < 20 ? 'offline' : (Math.random() > 0.03 ? 'online' : 'missing')

        devices.push({
            id: `${siteId}-device-${deviceCounter++}`,
            deviceId: type === 'motion'
                ? `MSN-${String(serialCounter++).padStart(4, '0')}`
                : `LS-${String(serialCounter++).padStart(4, '0')}`,
            serialNumber: `SN-2024-${String(serialCounter - 1).padStart(4, '0')}-${type === 'motion' ? 'M' : 'L'}${String(Math.floor(Math.random() * 9) + 1)}`,
            type,
            signal: status === 'online' ? Math.floor(Math.random() * 40) + 50 : Math.floor(Math.random() * 20),
            battery,
            status,
            location: type === 'motion' ? 'Doorway' : 'Exterior Wall',
            zone: 'Grocery & Food',
            x: Math.random(),
            y: Math.random(),
        })
    }

    return devices
}

/**
 * Generate site-specific zones
 * Uses the same zone structure but with site-specific device assignments
 */
function generateSiteZones(siteId: string): Omit<Zone, 'id' | 'createdAt' | 'updatedAt'>[] {
    // Use the same zone structure for all sites
    // Device assignments will be synced when devices are loaded
    return initialZones.map(zone => ({
        ...zone,
        deviceIds: [], // Will be populated when devices are synced
    }))
}

/**
 * Generate complete site data
 */
export function generateSiteData(siteId: string): SiteData {
    const devices = generateSiteDevices(siteId)
    const zones = generateSiteZones(siteId)

    const onlineDevices = devices.filter(d => d.status === 'online').length
    const offlineDevices = devices.filter(d => d.status === 'offline').length
    const missingDevices = devices.filter(d => d.status === 'missing').length
    const healthPercentage = devices.length > 0
        ? Math.round((onlineDevices / devices.length) * 100)
        : 100

    return {
        devices,
        zones,
        stats: {
            totalDevices: devices.length,
            onlineDevices,
            offlineDevices,
            missingDevices,
            totalZones: zones.length,
            healthPercentage,
        },
    }
}

/**
 * Get all site data (for initialization)
 */
export function getAllSiteData(): Record<string, SiteData> {
    const siteIds = ['site-1234', 'site-2156', 'site-3089', 'site-4421', 'site-5567']
    const result: Record<string, SiteData> = {}

    for (const siteId of siteIds) {
        result[siteId] = generateSiteData(siteId)
    }

    return result
}

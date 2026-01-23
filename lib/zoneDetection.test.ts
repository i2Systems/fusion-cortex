import { describe, it, expect } from 'vitest'
import { detectZonesFromDevices } from './zoneDetection'
import { Device } from './mockData'

// Helper to create mock devices
function createDevice(id: string, x?: number, y?: number, location?: string): Device {
    return {
        id,
        deviceId: `DEV-${id}`,
        serialNumber: `SN-${id}`,
        type: 'fixture-16ft-power-entry',
        signal: 80,
        status: 'online',
        location: location || 'Test Location',
        x,
        y,
    }
}

describe('zoneDetection', () => {
    describe('detectZonesFromDevices', () => {
        it('should return empty array for empty devices', () => {
            const zones = detectZonesFromDevices([])
            expect(zones).toEqual([])
        })

        it('should return empty array when no devices have positions', () => {
            const devices: Device[] = [
                createDevice('1'), // no x, y
                createDevice('2'), // no x, y
            ]
            const zones = detectZonesFromDevices(devices)
            expect(zones).toEqual([])
        })

        it('should filter out devices without positions', () => {
            const devices: Device[] = [
                createDevice('1', 0.1, 0.1),
                createDevice('2'), // no position
                createDevice('3', 0.15, 0.15),
            ]
            const zones = detectZonesFromDevices(devices)

            // Should only process the 2 devices with positions
            const totalDevices = zones.reduce((sum, z) => sum + (z.deviceIds?.length || 0), 0)
            expect(totalDevices).toBe(2)
        })

        it('should cluster nearby devices together', () => {
            // Create a cluster of devices close together
            const devices: Device[] = [
                createDevice('1', 0.1, 0.1),
                createDevice('2', 0.12, 0.12),
                createDevice('3', 0.15, 0.15),
                // Far away cluster
                createDevice('4', 0.8, 0.8),
                createDevice('5', 0.82, 0.82),
                createDevice('6', 0.85, 0.85),
            ]

            const zones = detectZonesFromDevices(devices)
            expect(zones.length).toBeGreaterThanOrEqual(1)
            expect(zones.length).toBeLessThanOrEqual(2)
        })

        it('should limit to maximum 12 zones', () => {
            // Create many scattered devices
            const devices: Device[] = []
            for (let i = 0; i < 50; i++) {
                devices.push(createDevice(`${i}`, Math.random(), Math.random()))
            }

            const zones = detectZonesFromDevices(devices)
            expect(zones.length).toBeLessThanOrEqual(12)
        })

        it('should generate zone polygons with correct structure', () => {
            const devices: Device[] = [
                createDevice('1', 0.2, 0.2),
                createDevice('2', 0.3, 0.3),
                createDevice('3', 0.25, 0.25),
            ]

            const zones = detectZonesFromDevices(devices)

            zones.forEach(zone => {
                // Polygon should exist and have points
                expect(zone.polygon).toBeDefined()
                expect(zone.polygon!.length).toBeGreaterThanOrEqual(4)

                // Each point should have x and y
                zone.polygon!.forEach(point => {
                    expect(point.x).toBeDefined()
                    expect(point.y).toBeDefined()
                    // Should be normalized (0-1)
                    expect(point.x).toBeGreaterThanOrEqual(0)
                    expect(point.x).toBeLessThanOrEqual(1)
                    expect(point.y).toBeGreaterThanOrEqual(0)
                    expect(point.y).toBeLessThanOrEqual(1)
                })
            })
        })

        it('should generate zone names', () => {
            const devices: Device[] = [
                createDevice('1', 0.2, 0.2, 'Electronics'),
                createDevice('2', 0.25, 0.25, 'Electronics'),
            ]

            const zones = detectZonesFromDevices(devices)

            zones.forEach(zone => {
                expect(zone.name).toBeDefined()
                expect(zone.name.length).toBeGreaterThan(0)
            })
        })

        it('should assign zone colors', () => {
            const devices: Device[] = [
                createDevice('1', 0.2, 0.2),
                createDevice('2', 0.25, 0.25),
            ]

            const zones = detectZonesFromDevices(devices)

            zones.forEach(zone => {
                expect(zone.color).toBeDefined()
                expect(zone.color).toMatch(/^#[0-9a-fA-F]{6}$/) // Valid hex color
            })
        })

        it('should include device IDs in zones', () => {
            const devices: Device[] = [
                createDevice('dev-1', 0.2, 0.2),
                createDevice('dev-2', 0.25, 0.25),
            ]

            const zones = detectZonesFromDevices(devices)

            const allDeviceIds = zones.flatMap(z => z.deviceIds || [])
            expect(allDeviceIds).toContain('dev-1')
            expect(allDeviceIds).toContain('dev-2')
        })
    })
})

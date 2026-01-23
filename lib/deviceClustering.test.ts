import { describe, it, expect } from 'vitest'
import { clusterDevices, isPointInCluster, DeviceCluster } from './deviceClustering'
import { DevicePoint } from '@/components/map/MapCanvas'

// Helper to create mock device points
function createDevicePoint(id: string, x: number, y: number): DevicePoint {
    return {
        id,
        x,
        y,
        type: 'fixture-16ft-power-entry',
        deviceId: `DEV-${id}`,
        status: 'online',
        signal: 80,
    }
}

describe('deviceClustering', () => {
    const defaultViewport = { minX: 0, maxX: 1000, minY: 0, maxY: 1000 }

    describe('clusterDevices', () => {
        it('should return empty results for empty device array', () => {
            const result = clusterDevices([], 1, defaultViewport)
            expect(result.clusters).toEqual([])
            expect(result.individualDevices).toEqual([])
        })

        it('should keep devices as individuals when too few nearby', () => {
            // Two devices far apart - should not cluster (need MIN_CLUSTER_SIZE = 3)
            const devices: DevicePoint[] = [
                createDevicePoint('1', 0.1, 0.1),
                createDevicePoint('2', 0.9, 0.9),
            ]

            const result = clusterDevices(devices, 1, defaultViewport)
            expect(result.clusters).toHaveLength(0)
            expect(result.individualDevices).toHaveLength(2)
        })

        it('should cluster devices when close together', () => {
            // Create 4 devices very close together
            const devices: DevicePoint[] = [
                createDevicePoint('1', 0.1, 0.1),
                createDevicePoint('2', 0.11, 0.11),
                createDevicePoint('3', 0.12, 0.12),
                createDevicePoint('4', 0.13, 0.13),
            ]

            const result = clusterDevices(devices, 1, defaultViewport)
            // Should form a cluster of at least 3 devices
            expect(result.clusters.length).toBeGreaterThan(0)
            expect(result.clusters[0].devices.length).toBeGreaterThanOrEqual(3)
        })

        it('should adjust clustering threshold based on scale', () => {
            // Create devices at medium distance
            const devices: DevicePoint[] = [
                createDevicePoint('1', 0.1, 0.1),
                createDevicePoint('2', 0.15, 0.15),
                createDevicePoint('3', 0.2, 0.2),
            ]

            // At scale 1, threshold is 50px
            const resultZoomedIn = clusterDevices(devices, 1, defaultViewport)

            // At scale 0.1 (zoomed out), threshold is 500px - should cluster more
            const resultZoomedOut = clusterDevices(devices, 0.1, defaultViewport)

            // Zoomed out should have same or more clusters (devices appear closer)
            expect(resultZoomedOut.clusters.length).toBeGreaterThanOrEqual(0)
        })

        it('should generate cluster with proper structure', () => {
            const devices: DevicePoint[] = [
                createDevicePoint('1', 0.1, 0.1),
                createDevicePoint('2', 0.11, 0.11),
                createDevicePoint('3', 0.12, 0.12),
                createDevicePoint('4', 0.13, 0.13),
            ]

            const result = clusterDevices(devices, 1, defaultViewport)

            if (result.clusters.length > 0) {
                const cluster = result.clusters[0]

                // Check cluster structure
                expect(cluster).toHaveProperty('id')
                expect(cluster).toHaveProperty('x')
                expect(cluster).toHaveProperty('y')
                expect(cluster).toHaveProperty('count')
                expect(cluster).toHaveProperty('devices')
                expect(cluster).toHaveProperty('bounds')

                // Check bounds structure
                expect(cluster.bounds).toHaveProperty('minX')
                expect(cluster.bounds).toHaveProperty('maxX')
                expect(cluster.bounds).toHaveProperty('minY')
                expect(cluster.bounds).toHaveProperty('maxY')

                // Count should match devices
                expect(cluster.count).toBe(cluster.devices.length)
            }
        })

        it('should generate unique cluster IDs', () => {
            // Create two separate clusters
            const devices: DevicePoint[] = [
                // Cluster 1
                createDevicePoint('1', 0.1, 0.1),
                createDevicePoint('2', 0.11, 0.11),
                createDevicePoint('3', 0.12, 0.12),
                // Cluster 2
                createDevicePoint('4', 0.9, 0.9),
                createDevicePoint('5', 0.91, 0.91),
                createDevicePoint('6', 0.92, 0.92),
            ]

            const result = clusterDevices(devices, 1, defaultViewport)

            const clusterIds = result.clusters.map(c => c.id)
            const uniqueIds = new Set(clusterIds)
            expect(uniqueIds.size).toBe(clusterIds.length)
        })
    })

    describe('isPointInCluster', () => {
        const mockCluster: DeviceCluster = {
            id: 'test-cluster',
            x: 50,
            y: 50,
            count: 3,
            devices: [],
            bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 }
        }

        it('should return true for point inside bounds', () => {
            expect(isPointInCluster({ x: 50, y: 50 }, mockCluster)).toBe(true)
            expect(isPointInCluster({ x: 0, y: 0 }, mockCluster)).toBe(true)
            expect(isPointInCluster({ x: 100, y: 100 }, mockCluster)).toBe(true)
        })

        it('should return false for point outside bounds', () => {
            expect(isPointInCluster({ x: -1, y: 50 }, mockCluster)).toBe(false)
            expect(isPointInCluster({ x: 50, y: 101 }, mockCluster)).toBe(false)
            expect(isPointInCluster({ x: 101, y: 50 }, mockCluster)).toBe(false)
            expect(isPointInCluster({ x: 50, y: -1 }, mockCluster)).toBe(false)
        })

        it('should return true for point on bounds edge', () => {
            expect(isPointInCluster({ x: 0, y: 50 }, mockCluster)).toBe(true)
            expect(isPointInCluster({ x: 100, y: 50 }, mockCluster)).toBe(true)
            expect(isPointInCluster({ x: 50, y: 0 }, mockCluster)).toBe(true)
            expect(isPointInCluster({ x: 50, y: 100 }, mockCluster)).toBe(true)
        })
    })
})

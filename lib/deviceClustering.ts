/**
 * Device Clustering Utility
 * 
 * Groups nearby devices into clusters for performance when rendering thousands of devices.
 * Allows expanding clusters to see individual devices.
 * 
 * AI Note: This improves performance and legibility when dealing with large device counts.
 */

import { DevicePoint } from '@/components/map/MapCanvas'

export interface DeviceCluster {
  id: string
  x: number
  y: number
  count: number
  devices: DevicePoint[]
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
}

const CLUSTER_THRESHOLD = 50 // Minimum distance in pixels to cluster devices
const MIN_CLUSTER_SIZE = 3 // Minimum devices needed to form a cluster

/**
 * Cluster devices that are close together
 * Returns both clusters and unclustered individual devices
 */
export function clusterDevices(
  devices: DevicePoint[],
  scale: number,
  viewportBounds: { minX: number; maxX: number; minY: number; maxY: number }
): {
  clusters: DeviceCluster[]
  individualDevices: DevicePoint[]
} {
  // Adjust threshold based on zoom level (cluster more when zoomed out)
  const adjustedThreshold = CLUSTER_THRESHOLD / scale
  
  const clusters: DeviceCluster[] = []
  const processed = new Set<string>()
  const individualDevices: DevicePoint[] = []
  
  // Convert normalized coordinates to canvas coordinates for clustering
  const devicesWithCanvasCoords = devices.map(device => {
    // For clustering, we'll use a simple conversion assuming 0-1 maps to viewport
    const canvasX = device.x * (viewportBounds.maxX - viewportBounds.minX) + viewportBounds.minX
    const canvasY = device.y * (viewportBounds.maxY - viewportBounds.minY) + viewportBounds.minY
    return { ...device, canvasX, canvasY }
  })
  
  devicesWithCanvasCoords.forEach(device => {
    if (processed.has(device.id)) return
    
    // Find nearby devices
    const nearbyDevices = devicesWithCanvasCoords.filter(other => {
      if (processed.has(other.id) || other.id === device.id) return false
      
      const distance = Math.sqrt(
        Math.pow(device.canvasX - other.canvasX, 2) +
        Math.pow(device.canvasY - other.canvasY, 2)
      )
      return distance < adjustedThreshold
    })
    
    // If we have enough nearby devices, create a cluster
    if (nearbyDevices.length >= MIN_CLUSTER_SIZE - 1) {
      const clusterDevices = [device, ...nearbyDevices]
      clusterDevices.forEach(d => processed.add(d.id))
      
      // Calculate cluster center and bounds
      const xs = clusterDevices.map(d => d.canvasX)
      const ys = clusterDevices.map(d => d.canvasY)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      
      clusters.push({
        id: `cluster-${device.id}`,
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
        count: clusterDevices.length,
        devices: clusterDevices.map(({ canvasX, canvasY, ...rest }) => rest),
        bounds: { minX, maxX, minY, maxY },
      })
    } else {
      // Not enough devices nearby, keep as individual
      individualDevices.push(device)
      processed.add(device.id)
    }
  })
  
  return { clusters, individualDevices }
}

/**
 * Check if a point is within a cluster's bounds
 */
export function isPointInCluster(
  point: { x: number; y: number },
  cluster: DeviceCluster
): boolean {
  return (
    point.x >= cluster.bounds.minX &&
    point.x <= cluster.bounds.maxX &&
    point.y >= cluster.bounds.minY &&
    point.y <= cluster.bounds.maxY
  )
}


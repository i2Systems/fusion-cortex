/**
 * Zone Router
 * 
 * tRPC procedures for zone operations.
 */

import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { logger } from '@/lib/logger'
import { withRetry, isConnectionError } from '../utils/withRetry'

const polygonPointSchema = z.object({
  x: z.number(),
  y: z.number(),
})

export const zoneRouter = router({
  list: publicProcedure
    .input(z.object({
      siteId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      if (!input.siteId) {
        return []
      }

      const fetchZones = async () => {
        const zones = await prisma.zone.findMany({
          where: { siteId: input.siteId },
          include: {
            ZoneDevice: {
              include: { Device: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        })

        return zones.map(zone => ({
          id: zone.id,
          name: zone.name,
          color: zone.color,
          description: zone.description,
          polygon: zone.polygon as Array<{ x: number; y: number }> | null,
          deviceIds: zone.ZoneDevice.map((zd: any) => zd.deviceId),
          daylightEnabled: zone.daylightEnabled,
          minDaylight: zone.minDaylight,
          createdAt: zone.createdAt,
          updatedAt: zone.updatedAt,
        }))
      }

      try {
        return await withRetry(fetchZones, { context: 'zone.list', fallback: [] })
      } catch (error: any) {
        // Handle database connection errors in development
        if (isConnectionError(error)) {
          if (process.env.NODE_ENV === 'development') {
            logger.warn('⚠️  Database connection error in development. Returning empty array.')
            return []
          }
          throw new Error('Database connection failed. Please check your DATABASE_URL environment variable.')
        }
        return []
      }
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string(),
      siteId: z.string(),
      color: z.string().optional(),
      description: z.string().optional(),
      polygon: z.array(polygonPointSchema).optional(),
      deviceIds: z.array(z.string()).optional().default([]),
    }))
    .mutation(async ({ input }) => {
      const createZone = async () => {
        // Filter out device IDs that don't exist in the database
        let validDeviceIds: string[] = []
        if (input.deviceIds.length > 0) {
          const existingDevices = await prisma.device.findMany({
            where: {
              id: { in: input.deviceIds },
              siteId: input.siteId,
            },
            select: { id: true },
          })

          const existingDeviceIds = new Set(existingDevices.map(d => d.id))
          validDeviceIds = input.deviceIds.filter(id => existingDeviceIds.has(id))

          const invalidDeviceIds = input.deviceIds.filter(id => !existingDeviceIds.has(id))
          if (invalidDeviceIds.length > 0) {
            logger.warn(`Zone creation: Skipping ${invalidDeviceIds.length} device IDs that don't exist`)
          }
        }

        const zone = await prisma.zone.create({
          data: {
            id: randomUUID(),
            name: input.name,
            siteId: input.siteId,
            color: input.color || '#4c7dff',
            description: input.description,
            polygon: input.polygon ? (input.polygon as any) : null,
            updatedAt: new Date(),
            ZoneDevice: validDeviceIds.length > 0 ? {
              create: validDeviceIds.map(deviceId => ({
                id: randomUUID(),
                deviceId,
              })),
            } : undefined,
          },
          include: {
            ZoneDevice: { include: { Device: true } },
          },
        })

        return {
          id: zone.id,
          name: zone.name,
          color: zone.color,
          description: zone.description,
          polygon: zone.polygon as Array<{ x: number; y: number }> | null,
          deviceIds: zone.ZoneDevice.map((zd: any) => zd.deviceId),
          createdAt: zone.createdAt,
          updatedAt: zone.updatedAt,
        }
      }

      try {
        return await withRetry(createZone, { context: 'zone.create' })
      } catch (error: any) {
        // Handle database connection errors
        if (isConnectionError(error)) {
          throw new Error('Database connection failed. Please check your DATABASE_URL environment variable.')
        }
        // Handle foreign key constraint violations
        if (error.code === 'P2003' || error.message?.includes('Foreign key constraint')) {
          throw new Error(`Cannot create zone: One or more device IDs do not exist in the database.`)
        }
        throw new Error(`Failed to create zone: ${error.message || 'Unknown error'}`)
      }
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      color: z.string().optional(),
      description: z.string().optional(),
      polygon: z.array(polygonPointSchema).optional(),
      deviceIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, deviceIds, ...updates } = input

      const performUpdate = async () => {
        // Get the zone to find its siteId for validation
        const zone = await prisma.zone.findUnique({
          where: { id },
          select: { siteId: true },
        })

        if (!zone) {
          throw new Error(`Zone with ID ${id} not found`)
        }

        // If deviceIds is provided, validate and update relationships
        if (deviceIds !== undefined) {
          if (deviceIds.length > 0) {
            const existingDevices = await prisma.device.findMany({
              where: { id: { in: deviceIds }, siteId: zone.siteId },
              select: { id: true },
            })

            const existingDeviceIds = new Set(existingDevices.map(d => d.id))
            const invalidDeviceIds = deviceIds.filter(deviceId => !existingDeviceIds.has(deviceId))

            if (invalidDeviceIds.length > 0) {
              throw new Error(`The following device IDs do not exist: ${invalidDeviceIds.join(', ')}`)
            }
          }

          await prisma.zoneDevice.deleteMany({ where: { zoneId: id } })

          if (deviceIds.length > 0) {
            await prisma.zoneDevice.createMany({
              data: deviceIds.map(deviceId => ({
                id: randomUUID(),
                zoneId: id,
                deviceId,
              })),
            })
          }
        }

        const updatedZone = await prisma.zone.update({
          where: { id },
          data: { ...updates, polygon: input.polygon ? (input.polygon as any) : undefined },
          include: { ZoneDevice: { include: { Device: true } } },
        })

        return {
          id: updatedZone.id,
          name: updatedZone.name,
          color: updatedZone.color,
          description: updatedZone.description,
          polygon: updatedZone.polygon as Array<{ x: number; y: number }> | null,
          deviceIds: updatedZone.ZoneDevice.map((zd: any) => zd.deviceId),
          createdAt: updatedZone.createdAt,
          updatedAt: updatedZone.updatedAt,
        }
      }

      try {
        return await withRetry(performUpdate, { context: 'zone.update' })
      } catch (error: any) {
        // Handle database connection errors
        if (isConnectionError(error)) {
          throw new Error('Database connection failed. Please check your DATABASE_URL environment variable.')
        }
        // Handle foreign key constraint violations
        if (error.code === 'P2003' || error.message?.includes('Foreign key constraint')) {
          throw new Error(`Cannot update zone: One or more device IDs do not exist.`)
        }
        // Handle "record not found" errors
        if (error.code === 'P2025' || error.message?.includes('not found')) {
          throw new Error(`Zone with ID ${input.id} not found in database`)
        }
        throw new Error(`Failed to update zone: ${error.message || 'Unknown error'}`)
      }
    }),

  delete: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      await prisma.zone.delete({
        where: { id: input.id },
      })
      return { success: true }
    }),

  saveAll: publicProcedure
    .input(z.object({
      siteId: z.string(),
      zones: z.array(z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
        description: z.string().optional(),
        polygon: z.array(polygonPointSchema).optional(),
        deviceIds: z.array(z.string()).optional().default([]),
      })),
    }))
    .mutation(async ({ input }) => {
      // Get existing zones for this site
      const existingZones = await prisma.zone.findMany({
        where: { siteId: input.siteId },
      })
      const existingZoneIds = new Set(existingZones.map(z => z.id))
      const inputZoneIds = new Set(input.zones.map(z => z.id))

      // Delete zones that are no longer in the input
      const zonesToDelete = existingZones.filter(z => !inputZoneIds.has(z.id))
      if (zonesToDelete.length > 0) {
        await prisma.zone.deleteMany({
          where: {
            id: { in: zonesToDelete.map(z => z.id) },
          },
        })
      }

      // Update or create zones
      for (const zoneData of input.zones) {
        if (existingZoneIds.has(zoneData.id)) {
          // Update existing zone
          await prisma.zone.update({
            where: { id: zoneData.id },
            data: {
              name: zoneData.name,
              color: zoneData.color,
              description: zoneData.description,
              polygon: zoneData.polygon ? (zoneData.polygon as any) : null,
            },
          })

          // Update device relationships
          await prisma.zoneDevice.deleteMany({
            where: { zoneId: zoneData.id },
          })
          if (zoneData.deviceIds && zoneData.deviceIds.length > 0) {
            await prisma.zoneDevice.createMany({
              data: zoneData.deviceIds.map(deviceId => ({
                id: randomUUID(),
                zoneId: zoneData.id,
                deviceId,
              })),
            })
          }
        } else {
          // Create new zone
          await prisma.zone.create({
            data: {
              id: zoneData.id,
              name: zoneData.name,
              siteId: input.siteId,
              color: zoneData.color,
              description: zoneData.description,
              polygon: zoneData.polygon ? (zoneData.polygon as any) : null,
              updatedAt: new Date(),
              ZoneDevice: {
                create: (zoneData.deviceIds || []).map(deviceId => ({
                  id: randomUUID(),
                  deviceId,
                })),
              },
            },
          })
        }
      }

      return { success: true, saved: input.zones.length }
    }),
})


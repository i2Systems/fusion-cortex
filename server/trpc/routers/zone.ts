/**
 * Zone Router
 * 
 * tRPC procedures for zone operations.
 */

import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'

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
      
      try {
        const zones = await prisma.zone.findMany({
          where: {
            siteId: input.siteId,
          },
          include: {
            devices: {
              include: {
                device: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        })
        
        return zones.map(zone => ({
          id: zone.id,
          name: zone.name,
          color: zone.color,
          description: zone.description,
          polygon: zone.polygon as Array<{ x: number; y: number }> | null,
          deviceIds: zone.devices.map(zd => zd.deviceId),
          daylightEnabled: zone.daylightEnabled,
          minDaylight: zone.minDaylight,
          createdAt: zone.createdAt,
          updatedAt: zone.updatedAt,
        }))
      } catch (error: any) {
        console.error('Error in zone.list:', {
          message: error.message,
          code: error.code,
          siteId: input.siteId,
        })
        // Return empty array on error to prevent UI crashes
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
      const zone = await prisma.zone.create({
        data: {
          name: input.name,
          siteId: input.siteId,
          color: input.color || '#4c7dff',
          description: input.description,
          polygon: input.polygon ? (input.polygon as any) : null,
          devices: {
            create: input.deviceIds.map(deviceId => ({
              deviceId,
            })),
          },
        },
      })
      
      return {
        id: zone.id,
        name: zone.name,
        color: zone.color,
        description: zone.description,
        polygon: zone.polygon as Array<{ x: number; y: number }> | null,
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
      
      // If deviceIds is provided, update the zone-device relationships
      if (deviceIds !== undefined) {
        // Delete existing relationships
        await prisma.zoneDevice.deleteMany({
          where: { zoneId: id },
        })
        
        // Create new relationships
        if (deviceIds.length > 0) {
          await prisma.zoneDevice.createMany({
            data: deviceIds.map(deviceId => ({
              zoneId: id,
              deviceId,
            })),
          })
        }
      }
      
      const zone = await prisma.zone.update({
        where: { id },
        data: {
          ...updates,
          polygon: input.polygon ? (input.polygon as any) : undefined,
        },
      })
      
      return {
        id: zone.id,
        name: zone.name,
        color: zone.color,
        description: zone.description,
        polygon: zone.polygon as Array<{ x: number; y: number }> | null,
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
              devices: {
                create: (zoneData.deviceIds || []).map(deviceId => ({
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


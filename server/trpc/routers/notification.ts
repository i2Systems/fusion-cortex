import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { DeviceStatus } from '@prisma/client';

export const notificationRouter = router({
    list: publicProcedure
        .input(z.object({
            siteId: z.string().optional(),
        }))
        .query(async ({ input }) => {
            const { siteId } = input;
            const notifications = [];

            // 1. Get unresolved faults
            const faults = await prisma.fault.findMany({
                where: {
                    resolved: false,
                    device: siteId ? { siteId } : undefined,
                },
                include: {
                    device: {
                        select: {
                            deviceId: true,
                            siteId: true,
                            site: { select: { name: true } },
                        },
                    },
                },
                orderBy: { detectedAt: 'desc' },
                take: 20, // Limit to recent faults
            });

            for (const fault of faults) {
                notifications.push({
                    id: `fault-${fault.id}`,
                    type: 'fault',
                    title: `${fault.faultType.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')} Detected`,
                    message: `${fault.description} (Device: ${fault.device.deviceId})`,
                    timestamp: fault.detectedAt,
                    read: false,
                    link: `/faults?id=${fault.id}&siteId=${fault.device.siteId}`, // Assuming /faults can handle query param, or just /faults
                    siteId: fault.device.siteId,
                });
            }

            // 2. Get Warranty Issues (Expired or Expiring in 30 days)
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            const warrantyDevices = await prisma.device.findMany({
                where: {
                    siteId: siteId,
                    AND: [
                        { warrantyExpiry: { not: null } },
                        { warrantyExpiry: { lte: thirtyDaysFromNow } },
                    ],
                },
                select: {
                    id: true,
                    deviceId: true,
                    siteId: true,
                    warrantyExpiry: true,
                },
                orderBy: {
                    warrantyExpiry: 'asc', // Show most urgent first
                },
                take: 50, // Increase limit to ensure coverage across sites
            });

            for (const device of warrantyDevices) {
                if (!device.warrantyExpiry) continue;
                const isExpired = device.warrantyExpiry < new Date();
                notifications.push({
                    id: `warranty-${device.id}`,
                    type: 'warranty',
                    title: isExpired ? 'Warranty Expired' : 'Warranty Expiring Soon',
                    message: `Device ${device.deviceId} warranty ${isExpired ? 'expired' : 'expires'} on ${device.warrantyExpiry.toLocaleDateString()}.`,
                    timestamp: device.warrantyExpiry,
                    read: false,
                    link: `/lookup?id=${device.id}&siteId=${device.siteId}`,
                    siteId: device.siteId,
                });
            }

            // 3. Device Health (Low Signal or Offline)
            const healthDevices = await prisma.device.findMany({
                where: {
                    siteId: siteId,
                    OR: [
                        { signal: { lt: 20, gt: 0 } },
                        { status: DeviceStatus.MISSING },
                    ],
                },
                select: {
                    id: true,
                    deviceId: true,
                    siteId: true,
                    status: true,
                    signal: true,
                    updatedAt: true,
                },
                orderBy: {
                    updatedAt: 'desc', // Show most recently updated
                },
                take: 50, // Increase limit
            });

            for (const device of healthDevices) {
                let title = 'Device Issue';
                let message = `Device ${device.deviceId} requires attention.`;

                if (device.status === DeviceStatus.MISSING) {
                    title = 'Device Missing';
                    message = `Device ${device.deviceId} is reported as MISSING.`;
                } else if (device.signal && device.signal < 20) {
                    title = 'Weak Signal';
                    message = `Device ${device.deviceId} has poor signal strength (${device.signal}%).`;
                }

                notifications.push({
                    id: `health-${device.id}`,
                    type: 'device',
                    title: title,
                    message: message,
                    timestamp: device.updatedAt,
                    read: false,
                    link: `/faults?id=${device.id}&siteId=${device.siteId}`,
                    siteId: device.siteId,
                });
            }

            // Sort by timestamp desc
            return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        }),
});

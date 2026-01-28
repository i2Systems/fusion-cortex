-- CreateEnum
CREATE TYPE "BACnetStatus" AS ENUM ('CONNECTED', 'ERROR', 'NOT_ASSIGNED');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE', 'MISSING', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('FIXTURE_16FT_POWER_ENTRY', 'FIXTURE_12FT_POWER_ENTRY', 'FIXTURE_8FT_POWER_ENTRY', 'FIXTURE_16FT_FOLLOWER', 'FIXTURE_12FT_FOLLOWER', 'FIXTURE_8FT_FOLLOWER', 'MOTION_SENSOR', 'LIGHT_SENSOR');

-- CreateEnum
CREATE TYPE "FirmwareDeviceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "FirmwareStatus" AS ENUM ('UP_TO_DATE', 'UPDATE_AVAILABLE', 'UPDATE_IN_PROGRESS', 'UPDATE_FAILED', 'UPDATE_REQUIRED');

-- CreateEnum
CREATE TYPE "FirmwareUpdateStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "BACnetMapping" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "bacnetObjectId" TEXT,
    "status" "BACnetStatus" NOT NULL DEFAULT 'NOT_ASSIGNED',
    "lastConnected" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BACnetMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "type" "DeviceType" NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'OFFLINE',
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "orientation" DOUBLE PRECISION,
    "signal" INTEGER,
    "battery" INTEGER,
    "buildDate" TIMESTAMP(3),
    "cct" INTEGER,
    "warrantyStatus" TEXT,
    "warrantyExpiry" TIMESTAMP(3),
    "partsList" JSONB,
    "parentId" TEXT,
    "componentType" TEXT,
    "componentSerialNumber" TEXT,
    "firmwareVersion" TEXT,
    "firmwareTarget" TEXT,
    "firmwareStatus" "FirmwareStatus" NOT NULL DEFAULT 'UP_TO_DATE',
    "lastFirmwareUpdate" TIMESTAMP(3),
    "siteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fault" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "faultType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirmwareDeviceUpdate" (
    "id" TEXT NOT NULL,
    "firmwareUpdateId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "status" "FirmwareDeviceStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FirmwareDeviceUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirmwareUpdate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL,
    "fileUrl" TEXT,
    "siteId" TEXT,
    "deviceTypes" "DeviceType"[],
    "status" "FirmwareUpdateStatus" NOT NULL DEFAULT 'PENDING',
    "totalDevices" INTEGER NOT NULL DEFAULT 0,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "inProgress" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FirmwareUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryImage" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "imageUrl" TEXT,
    "vectorDataUrl" TEXT,
    "zoomBounds" JSONB,
    "parentId" TEXT,
    "siteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" TEXT NOT NULL DEFAULT 'rule',
    "targetType" TEXT NOT NULL DEFAULT 'zone',
    "targetId" TEXT,
    "targetName" TEXT,
    "trigger" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "action" JSONB NOT NULL,
    "overrideBMS" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER,
    "siteId" TEXT NOT NULL,
    "zoneId" TEXT,
    "deviceId" TEXT,
    "targetZones" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggered" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storeNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "phone" TEXT,
    "manager" TEXT,
    "squareFootage" INTEGER,
    "openedDate" TIMESTAMP(3),
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#4c7dff',
    "description" TEXT,
    "polygon" JSONB,
    "daylightEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minDaylight" INTEGER,
    "siteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZoneDevice" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,

    CONSTRAINT "ZoneDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#4c7dff',
    "siteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupDevice" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,

    CONSTRAINT "GroupDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "siteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BACnetMapping_zoneId_key" ON "BACnetMapping"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_serialNumber_key" ON "Device"("serialNumber");

-- CreateIndex
CREATE INDEX "Device_deviceId_idx" ON "Device"("deviceId");

-- CreateIndex
CREATE INDEX "Device_firmwareStatus_idx" ON "Device"("firmwareStatus");

-- CreateIndex
CREATE INDEX "Device_firmwareVersion_idx" ON "Device"("firmwareVersion");

-- CreateIndex
CREATE INDEX "Device_parentId_idx" ON "Device"("parentId");

-- CreateIndex
CREATE INDEX "Device_serialNumber_idx" ON "Device"("serialNumber");

-- CreateIndex
CREATE INDEX "Device_siteId_idx" ON "Device"("siteId");

-- CreateIndex
CREATE INDEX "Device_siteId_status_idx" ON "Device"("siteId", "status");

-- CreateIndex
CREATE INDEX "Device_siteId_type_idx" ON "Device"("siteId", "type");

-- CreateIndex
CREATE INDEX "Device_siteId_warrantyExpiry_idx" ON "Device"("siteId", "warrantyExpiry");

-- CreateIndex
CREATE INDEX "Device_siteId_signal_idx" ON "Device"("siteId", "signal");

-- CreateIndex
CREATE INDEX "Device_siteId_parentId_idx" ON "Device"("siteId", "parentId");

-- CreateIndex
CREATE INDEX "Fault_detectedAt_idx" ON "Fault"("detectedAt");

-- CreateIndex
CREATE INDEX "Fault_deviceId_idx" ON "Fault"("deviceId");

-- CreateIndex
CREATE INDEX "Fault_resolved_idx" ON "Fault"("resolved");

-- CreateIndex
CREATE INDEX "Fault_deviceId_resolved_idx" ON "Fault"("deviceId", "resolved");

-- CreateIndex
CREATE INDEX "FirmwareDeviceUpdate_deviceId_idx" ON "FirmwareDeviceUpdate"("deviceId");

-- CreateIndex
CREATE INDEX "FirmwareDeviceUpdate_status_idx" ON "FirmwareDeviceUpdate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FirmwareDeviceUpdate_firmwareUpdateId_deviceId_key" ON "FirmwareDeviceUpdate"("firmwareUpdateId", "deviceId");

-- CreateIndex
CREATE INDEX "FirmwareUpdate_siteId_idx" ON "FirmwareUpdate"("siteId");

-- CreateIndex
CREATE INDEX "FirmwareUpdate_status_idx" ON "FirmwareUpdate"("status");

-- CreateIndex
CREATE INDEX "FirmwareUpdate_siteId_status_idx" ON "FirmwareUpdate"("siteId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryImage_libraryId_key" ON "LibraryImage"("libraryId");

-- CreateIndex
CREATE INDEX "LibraryImage_libraryId_idx" ON "LibraryImage"("libraryId");

-- CreateIndex
CREATE INDEX "Location_parentId_idx" ON "Location"("parentId");

-- CreateIndex
CREATE INDEX "Location_siteId_idx" ON "Location"("siteId");

-- CreateIndex
CREATE INDEX "Rule_siteId_idx" ON "Rule"("siteId");

-- CreateIndex
CREATE INDEX "Rule_zoneId_idx" ON "Rule"("zoneId");

-- CreateIndex
CREATE INDEX "Rule_deviceId_idx" ON "Rule"("deviceId");

-- CreateIndex
CREATE INDEX "Rule_siteId_enabled_idx" ON "Rule"("siteId", "enabled");

-- CreateIndex
CREATE INDEX "Zone_siteId_idx" ON "Zone"("siteId");

-- CreateIndex
CREATE INDEX "Zone_siteId_daylightEnabled_idx" ON "Zone"("siteId", "daylightEnabled");

-- CreateIndex
CREATE INDEX "ZoneDevice_deviceId_idx" ON "ZoneDevice"("deviceId");

-- CreateIndex
CREATE INDEX "ZoneDevice_zoneId_idx" ON "ZoneDevice"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "ZoneDevice_zoneId_deviceId_key" ON "ZoneDevice"("zoneId", "deviceId");

-- CreateIndex
CREATE INDEX "Group_siteId_idx" ON "Group"("siteId");

-- CreateIndex
CREATE INDEX "GroupDevice_deviceId_idx" ON "GroupDevice"("deviceId");

-- CreateIndex
CREATE INDEX "GroupDevice_groupId_idx" ON "GroupDevice"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupDevice_groupId_deviceId_key" ON "GroupDevice"("groupId", "deviceId");

-- CreateIndex
CREATE INDEX "Person_siteId_idx" ON "Person"("siteId");

-- AddForeignKey
ALTER TABLE "BACnetMapping" ADD CONSTRAINT "BACnetMapping_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fault" ADD CONSTRAINT "Fault_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmwareDeviceUpdate" ADD CONSTRAINT "FirmwareDeviceUpdate_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmwareDeviceUpdate" ADD CONSTRAINT "FirmwareDeviceUpdate_firmwareUpdateId_fkey" FOREIGN KEY ("firmwareUpdateId") REFERENCES "FirmwareUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmwareUpdate" ADD CONSTRAINT "FirmwareUpdate_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneDevice" ADD CONSTRAINT "ZoneDevice_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneDevice" ADD CONSTRAINT "ZoneDevice_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDevice" ADD CONSTRAINT "GroupDevice_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDevice" ADD CONSTRAINT "GroupDevice_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

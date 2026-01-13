-- Migration: Add firmware fields to Device table
-- Created: 2025-01-13
-- Description: Adds firmware-related columns to support firmware update campaigns

-- Add firmware version tracking fields
ALTER TABLE "Device" 
ADD COLUMN IF NOT EXISTS "firmwareVersion" TEXT,
ADD COLUMN IF NOT EXISTS "firmwareTarget" TEXT,
ADD COLUMN IF NOT EXISTS "firmwareStatus" TEXT DEFAULT 'UP_TO_DATE',
ADD COLUMN IF NOT EXISTS "lastFirmwareUpdate" TIMESTAMP(3);

-- Create enum type for FirmwareStatus if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FirmwareStatus') THEN
        CREATE TYPE "FirmwareStatus" AS ENUM ('UP_TO_DATE', 'UPDATE_AVAILABLE', 'UPDATE_IN_PROGRESS', 'UPDATE_FAILED', 'UPDATE_REQUIRED');
    END IF;
END $$;

-- Update the column to use the enum type
ALTER TABLE "Device" 
ALTER COLUMN "firmwareStatus" TYPE "FirmwareStatus" 
USING "firmwareStatus"::"FirmwareStatus";

-- Set default value
ALTER TABLE "Device" 
ALTER COLUMN "firmwareStatus" SET DEFAULT 'UP_TO_DATE';

-- Add indexes for firmware queries
CREATE INDEX IF NOT EXISTS "Device_firmwareStatus_idx" ON "Device"("firmwareStatus");
CREATE INDEX IF NOT EXISTS "Device_firmwareVersion_idx" ON "Device"("firmwareVersion");

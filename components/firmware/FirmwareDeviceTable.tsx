/**
 * Firmware Device Table Component
 * 
 * Table showing devices in a firmware campaign with their update status.
 */

'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, Clock, AlertCircle, X, RefreshCw } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

interface DeviceUpdate {
  id: string
  deviceId: string
  status: string
  errorMessage?: string | null
  startedAt?: Date | null
  completedAt?: Date | null
  retryCount: number
  device: {
    id: string
    deviceId: string
    serialNumber: string
    type: string
    firmwareVersion?: string | null
    firmwareStatus?: string | null
  }
}

interface FirmwareDeviceTableProps {
  deviceUpdates: DeviceUpdate[]
  campaignId: string
  onRefresh: () => void
}

export function FirmwareDeviceTable({
  deviceUpdates,
  campaignId,
  onRefresh,
}: FirmwareDeviceTableProps) {
  // Update device mutation
  const updateDeviceMutation = trpc.firmware.updateDevice.useMutation({
    onSuccess: () => {
      onRefresh()
    },
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 size={14} className="text-green-400" />
      case 'IN_PROGRESS':
        return <Clock size={14} className="text-blue-400" />
      case 'FAILED':
        return <AlertCircle size={14} className="text-red-400" />
      case 'SKIPPED':
        return <X size={14} className="text-gray-400" />
      default:
        return <Clock size={14} className="text-yellow-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-400'
      case 'IN_PROGRESS':
        return 'bg-blue-500/20 text-blue-400'
      case 'FAILED':
        return 'bg-red-500/20 text-red-400'
      case 'SKIPPED':
        return 'bg-gray-500/20 text-gray-400'
      default:
        return 'bg-yellow-500/20 text-yellow-400'
    }
  }

  const handleRetry = async (deviceId: string) => {
    await updateDeviceMutation.mutateAsync({
      campaignId,
      deviceId,
    })
  }

  return (
    <div className="overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-subtle)]">
          <tr>
            <th className="text-left p-2 text-[var(--color-text-muted)] font-medium">Device</th>
            <th className="text-left p-2 text-[var(--color-text-muted)] font-medium">Type</th>
            <th className="text-left p-2 text-[var(--color-text-muted)] font-medium">Current Version</th>
            <th className="text-left p-2 text-[var(--color-text-muted)] font-medium">Status</th>
            <th className="text-left p-2 text-[var(--color-text-muted)] font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {deviceUpdates.map((deviceUpdate) => (
            <tr
              key={deviceUpdate.id}
              className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)]"
            >
              <td className="p-2">
                <div className="font-medium text-[var(--color-text)]">
                  {deviceUpdate.device.deviceId}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {deviceUpdate.device.serialNumber}
                </div>
              </td>
              <td className="p-2 text-[var(--color-text-muted)]">
                {deviceUpdate.device.type}
              </td>
              <td className="p-2 text-[var(--color-text-muted)]">
                {deviceUpdate.device.firmwareVersion || 'Unknown'}
              </td>
              <td className="p-2">
                <Badge className={getStatusColor(deviceUpdate.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(deviceUpdate.status)}
                    {deviceUpdate.status.replace('_', ' ')}
                  </span>
                </Badge>
                {deviceUpdate.errorMessage && (
                  <div className="text-xs text-red-400 mt-1">
                    {deviceUpdate.errorMessage}
                  </div>
                )}
              </td>
              <td className="p-2">
                {deviceUpdate.status === 'FAILED' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRetry(deviceUpdate.device.id)}
                    disabled={updateDeviceMutation.isPending}
                    title="Retry update"
                  >
                    <RefreshCw size={14} />
                  </Button>
                )}
                {deviceUpdate.status === 'PENDING' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRetry(deviceUpdate.device.id)}
                    disabled={updateDeviceMutation.isPending}
                    title="Start update"
                  >
                    <RefreshCw size={14} />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

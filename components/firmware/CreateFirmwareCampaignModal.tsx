/**
 * Create Firmware Campaign Modal Component
 * 
 * Modal for creating new firmware update campaigns.
 */

'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { trpc } from '@/lib/trpc/client'
import { useSite } from '@/lib/SiteContext'
import { ALL_DISPLAY_DEVICE_TYPES, getDeviceTypeLabel } from '@/lib/types'

interface CreateFirmwareCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateFirmwareCampaignModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateFirmwareCampaignModalProps) {
  const { activeSiteId } = useSite()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '',
    fileUrl: '',
    deviceTypes: [] as string[],
    scheduledAt: '',
  })

  const createCampaignMutation = trpc.firmware.createCampaign.useMutation({
    onSuccess: () => {
      onSuccess()
      // Reset form
      setFormData({
        name: '',
        description: '',
        version: '',
        fileUrl: '',
        deviceTypes: [],
        scheduledAt: '',
      })
    },
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.version || formData.deviceTypes.length === 0) {
      alert('Please fill in all required fields')
      return
    }

    try {
      await createCampaignMutation.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        version: formData.version,
        fileUrl: formData.fileUrl || undefined,
        siteId: activeSiteId || undefined,
        deviceTypes: formData.deviceTypes as any,
        scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt) : undefined,
      })
    } catch (error: any) {
      alert(error.message || 'Failed to create campaign')
    }
  }

  const toggleDeviceType = (deviceType: string) => {
    setFormData(prev => ({
      ...prev,
      deviceTypes: prev.deviceTypes.includes(deviceType)
        ? prev.deviceTypes.filter(t => t !== deviceType)
        : [...prev.deviceTypes, deviceType],
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border)] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-subtle)]">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Create Firmware Campaign
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Campaign Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Q1 2024 Security Patch"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description of this firmware update..."
              className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              rows={3}
            />
          </div>

          {/* Version */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Firmware Version *
            </label>
            <Input
              value={formData.version}
              onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
              placeholder="e.g., v2.1.3"
              required
            />
          </div>

          {/* File URL */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Firmware File URL (Optional)
            </label>
            <Input
              type="url"
              value={formData.fileUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, fileUrl: e.target.value }))}
              placeholder="https://example.com/firmware.bin"
            />
          </div>

          {/* Device Types */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Device Types * (Select at least one)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
              {ALL_DISPLAY_DEVICE_TYPES.map((deviceType) => (
                <label
                  key={deviceType}
                  className="flex items-center gap-2 p-2 rounded hover:bg-[var(--color-surface-subtle)] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.deviceTypes.includes(deviceType)}
                    onChange={() => toggleDeviceType(deviceType)}
                    className="rounded border-[var(--color-border)]"
                  />
                  <span className="text-sm text-[var(--color-text)]">
                    {getDeviceTypeLabel(deviceType)}
                  </span>
                </label>
              ))}
            </div>
            {formData.deviceTypes.length === 0 && (
              <p className="text-xs text-red-400 mt-1">
                Please select at least one device type
              </p>
            )}
          </div>

          {/* Scheduled At */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Schedule Update (Optional)
            </label>
            <Input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Leave empty to start immediately when campaign is started
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border-subtle)]">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createCampaignMutation.isPending || formData.deviceTypes.length === 0}
            >
              {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

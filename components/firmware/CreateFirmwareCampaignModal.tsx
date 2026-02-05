/**
 * Create Firmware Campaign Modal Component
 * 
 * Modal for creating new firmware update campaigns.
 */

'use client'

import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/lib/ToastContext'
import { trpc } from '@/lib/trpc/client'
import { useSite } from '@/lib/hooks/useSite'
import { ALL_DISPLAY_DEVICE_TYPES, getDisplayTypeLabel } from '@/lib/types'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

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
  const { addToast } = useToast()
  const modalRef = useRef<HTMLDivElement>(null)
  const titleId = `firmware-campaign-modal-title-${Math.random().toString(36).substr(2, 9)}`
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '',
    fileUrl: '',
    deviceTypes: [] as string[],
    scheduledAt: '',
  })
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; version?: string; deviceTypes?: string }>({})

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
      setFieldErrors({})
    },
  })

  // Focus trap
  useFocusTrap({
    isOpen,
    onClose,
    containerRef: modalRef,
    enabled: isOpen,
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors: { name?: string; version?: string; deviceTypes?: string } = {}
    if (!formData.name.trim()) errors.name = 'Campaign name is required'
    if (!formData.version.trim()) errors.version = 'Firmware version is required'
    if (formData.deviceTypes.length === 0) errors.deviceTypes = 'Select at least one device type'
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

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
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: error.message || 'Failed to create campaign'
      })
    }
  }

  const toggleDeviceType = (deviceType: string) => {
    setFormData(prev => ({
      ...prev,
      deviceTypes: prev.deviceTypes.includes(deviceType)
        ? prev.deviceTypes.filter(t => t !== deviceType)
        : [...prev.deviceTypes, deviceType],
    }))
    if (fieldErrors.deviceTypes) setFieldErrors(prev => ({ ...prev, deviceTypes: undefined }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-hidden="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'var(--color-backdrop)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border)] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-subtle)]">
          <h2 id={titleId} className="text-xl font-semibold text-[var(--color-text)]">
            Create Firmware Campaign
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            aria-label="Close dialog"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="firmware-campaign-name" className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Campaign Name *
            </label>
            <Input
              id="firmware-campaign-name"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }))
                if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }))
              }}
              placeholder="e.g., Q1 2024 Security Patch"
              required
              errorMessage={fieldErrors.name}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="firmware-campaign-description" className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Description
            </label>
            <textarea
              id="firmware-campaign-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description of this firmware update..."
              className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              rows={3}
            />
          </div>

          {/* Version */}
          <div>
            <label htmlFor="firmware-campaign-version" className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Firmware Version *
            </label>
            <Input
              id="firmware-campaign-version"
              value={formData.version}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, version: e.target.value }))
                if (fieldErrors.version) setFieldErrors(prev => ({ ...prev, version: undefined }))
              }}
              placeholder="e.g., v2.1.3"
              required
              errorMessage={fieldErrors.version}
            />
          </div>

          {/* File URL */}
          <div>
            <label htmlFor="firmware-campaign-file-url" className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Firmware File URL (Optional)
            </label>
            <Input
              id="firmware-campaign-file-url"
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
                  htmlFor={`firmware-device-type-${deviceType}`}
                  className="flex items-center gap-2 p-2 rounded hover:bg-[var(--color-surface-subtle)] cursor-pointer"
                >
                  <input
                    id={`firmware-device-type-${deviceType}`}
                    type="checkbox"
                    checked={formData.deviceTypes.includes(deviceType)}
                    onChange={() => toggleDeviceType(deviceType)}
                    className="rounded border-[var(--color-border)]"
                  />
                  <span className="text-sm text-[var(--color-text)]">
                    {getDisplayTypeLabel(deviceType)}
                  </span>
                </label>
              ))}
            </div>
            {fieldErrors.deviceTypes && (
              <p className="text-xs text-danger mt-1" role="alert">
                {fieldErrors.deviceTypes}
              </p>
            )}
          </div>

          {/* Scheduled At */}
          <div>
            <label htmlFor="firmware-campaign-scheduled-at" className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Schedule Update (Optional)
            </label>
            <Input
              id="firmware-campaign-scheduled-at"
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

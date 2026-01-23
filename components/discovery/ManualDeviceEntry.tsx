/**
 * Manual Device Entry Modal
 * 
 * Allows users to manually add devices by entering their information.
 * 
 * AI Note: Useful for devices that can't be discovered automatically or for quick entry.
 */

'use client'

import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import { DisplayDeviceType as DeviceType, isDisplayFixtureType as isFixtureType } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

interface ManualDeviceEntryProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (device: {
    deviceId: string
    serialNumber: string
    type: DeviceType
  }) => void
}

export function ManualDeviceEntry({ isOpen, onClose, onAdd }: ManualDeviceEntryProps) {
  const [deviceId, setDeviceId] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [type, setType] = useState<DeviceType>('fixture-16ft-power-entry')
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus trap for accessibility
  useFocusTrap({
    isOpen,
    onClose,
    containerRef: modalRef,
    enabled: isOpen,
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (deviceId.trim() && serialNumber.trim()) {
      onAdd({ deviceId: deviceId.trim(), serialNumber: serialNumber.trim(), type })
      setDeviceId('')
      setSerialNumber('')
      setType('fixture-16ft-power-entry')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
        style={{ backgroundColor: 'var(--color-backdrop)' }}
      />

      {/* Modal */}
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative w-full max-w-md bg-[var(--color-surface)] backdrop-blur-xl rounded-2xl border border-[var(--color-border-subtle)] shadow-[var(--shadow-strong)] p-6" 
        style={{ boxShadow: 'var(--glow-modal)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--color-text)]">
            Add Device Manually
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-subtle)] transition-colors text-[var(--color-text-muted)]"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="manual-device-id" className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              Device ID
            </label>
            <input
              id="manual-device-id"
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="e.g., FLX-1234"
              className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-glow-primary)]"
              required
            />
          </div>

          <div>
            <label htmlFor="manual-device-serial" className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              Serial Number
            </label>
            <input
              id="manual-device-serial"
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="e.g., SN-2024-1234-A1"
              className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-glow-primary)]"
              required
            />
          </div>

          <div>
            <label htmlFor="manual-device-type" className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              Device Type
            </label>
            <select
              id="manual-device-type"
              value={type}
              onChange={(e) => setType(e.target.value as DeviceType)}
              className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-glow-primary)]"
            >
              <option value="fixture-16ft-power-entry">16ft Power Entry</option>
              <option value="fixture-12ft-power-entry">12ft Power Entry</option>
              <option value="fixture-8ft-power-entry">8ft Power Entry</option>
              <option value="fixture-16ft-follower">16ft Follower</option>
              <option value="fixture-12ft-follower">12ft Follower</option>
              <option value="fixture-8ft-follower">8ft Follower</option>
              <option value="motion">Motion Sensor</option>
              <option value="light-sensor">Light Sensor</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              Add Device
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


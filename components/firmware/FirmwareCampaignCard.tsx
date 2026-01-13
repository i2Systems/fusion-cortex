/**
 * Firmware Campaign Card Component
 * 
 * Individual campaign card showing status, progress, and quick actions.
 */

'use client'

import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Play, Pause, X, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  description?: string | null
  version: string
  status: string
  totalDevices: number
  completed: number
  failed: number
  inProgress: number
  pending: number
  site?: {
    id: string
    name: string
    storeNumber?: string | null
  } | null
  createdAt: Date
  scheduledAt?: Date | null
  startedAt?: Date | null
  completedAt?: Date | null
}

interface FirmwareCampaignCardProps {
  campaign: Campaign
  isSelected: boolean
  onSelect: () => void
  onStart: () => void
  onPause: () => void
  onCancel: () => void
  onDelete: () => void
}

export function FirmwareCampaignCard({
  campaign,
  isSelected,
  onSelect,
  onStart,
  onPause,
  onCancel,
  onDelete,
}: FirmwareCampaignCardProps) {
  const progress = campaign.totalDevices > 0
    ? Math.round((campaign.completed / campaign.totalDevices) * 100)
    : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-400'
      case 'IN_PROGRESS':
        return 'bg-blue-500/20 text-blue-400'
      case 'FAILED':
        return 'bg-red-500/20 text-red-400'
      case 'CANCELLED':
        return 'bg-gray-500/20 text-gray-400'
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 size={14} />
      case 'IN_PROGRESS':
        return <Clock size={14} />
      case 'FAILED':
        return <AlertCircle size={14} />
      default:
        return <Clock size={14} />
    }
  }

  return (
    <Card
      className={`
        p-4 cursor-pointer transition-all
        ${isSelected 
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]' 
          : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border)]'
        }
      `}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[var(--color-text)] truncate">
              {campaign.name}
            </h3>
            <Badge className={getStatusColor(campaign.status)}>
              <span className="flex items-center gap-1">
                {getStatusIcon(campaign.status)}
                {campaign.status.replace('_', ' ')}
              </span>
            </Badge>
          </div>
          {campaign.description && (
            <p className="text-sm text-[var(--color-text-muted)] line-clamp-1">
              {campaign.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-muted)]">
            <span>Version: {campaign.version}</span>
            {campaign.site && (
              <span>Site: {campaign.site.name}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
          {campaign.status === 'PENDING' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onStart}
              title="Start campaign"
            >
              <Play size={16} />
            </Button>
          )}
          {campaign.status === 'IN_PROGRESS' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPause}
              title="Pause campaign"
            >
              <Pause size={16} />
            </Button>
          )}
          {campaign.status !== 'COMPLETED' && campaign.status !== 'CANCELLED' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              title="Cancel campaign"
            >
              <X size={16} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            title="Delete campaign"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {campaign.totalDevices > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-1">
            <span>Progress: {progress}%</span>
            <span>
              {campaign.completed} / {campaign.totalDevices} devices
            </span>
          </div>
          <div className="w-full h-2 bg-[var(--color-surface-subtle)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-muted)]">
            {campaign.completed > 0 && (
              <span className="text-green-400">✓ {campaign.completed} completed</span>
            )}
            {campaign.failed > 0 && (
              <span className="text-red-400">✗ {campaign.failed} failed</span>
            )}
            {campaign.inProgress > 0 && (
              <span className="text-blue-400">⟳ {campaign.inProgress} in progress</span>
            )}
            {campaign.pending > 0 && (
              <span className="text-yellow-400">⏳ {campaign.pending} pending</span>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

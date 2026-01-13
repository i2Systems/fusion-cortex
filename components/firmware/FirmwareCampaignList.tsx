/**
 * Firmware Campaign List Component
 * 
 * Displays a list of firmware update campaigns with status, progress, and actions.
 */

'use client'

import { FirmwareCampaignCard } from './FirmwareCampaignCard'

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

interface FirmwareCampaignListProps {
  campaigns: Campaign[]
  selectedCampaignId: string | null
  onSelectCampaign: (id: string | null) => void
  onStartCampaign: (id: string) => void
  onPauseCampaign: (id: string) => void
  onCancelCampaign: (id: string) => void
  onDeleteCampaign: (id: string) => void
}

export function FirmwareCampaignList({
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
  onStartCampaign,
  onPauseCampaign,
  onCancelCampaign,
  onDeleteCampaign,
}: FirmwareCampaignListProps) {
  return (
    <div className="p-[20px] space-y-3">
      {campaigns.map((campaign) => (
        <FirmwareCampaignCard
          key={campaign.id}
          campaign={campaign}
          isSelected={selectedCampaignId === campaign.id}
          onSelect={() => onSelectCampaign(campaign.id)}
          onStart={() => onStartCampaign(campaign.id)}
          onPause={() => onPauseCampaign(campaign.id)}
          onCancel={() => onCancelCampaign(campaign.id)}
          onDelete={() => onDeleteCampaign(campaign.id)}
        />
      ))}
    </div>
  )
}

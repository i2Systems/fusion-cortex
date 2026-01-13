/**
 * Firmware Progress Chart Component
 * 
 * Visual progress indicator showing completed, failed, in progress, and pending devices.
 */

'use client'

interface FirmwareProgressChartProps {
  total: number
  completed: number
  failed: number
  inProgress: number
  pending: number
}

export function FirmwareProgressChart({
  total,
  completed,
  failed,
  inProgress,
  pending,
}: FirmwareProgressChartProps) {
  const completedPercent = total > 0 ? (completed / total) * 100 : 0
  const failedPercent = total > 0 ? (failed / total) * 100 : 0
  const inProgressPercent = total > 0 ? (inProgress / total) * 100 : 0
  const pendingPercent = total > 0 ? (pending / total) * 100 : 0

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="relative w-full h-6 bg-[var(--color-surface-subtle)] rounded-full overflow-hidden">
        {completed > 0 && (
          <div
            className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-300"
            style={{ width: `${completedPercent}%` }}
          />
        )}
        {failed > 0 && (
          <div
            className="absolute h-full bg-red-500 transition-all duration-300"
            style={{
              left: `${completedPercent}%`,
              width: `${failedPercent}%`,
            }}
          />
        )}
        {inProgress > 0 && (
          <div
            className="absolute h-full bg-blue-500 transition-all duration-300"
            style={{
              left: `${completedPercent + failedPercent}%`,
              width: `${inProgressPercent}%`,
            }}
          />
        )}
        {pending > 0 && (
          <div
            className="absolute h-full bg-yellow-500/50 transition-all duration-300"
            style={{
              left: `${completedPercent + failedPercent + inProgressPercent}%`,
              width: `${pendingPercent}%`,
            }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {completed > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-[var(--color-text-muted)]">
              Completed: {completed}
            </span>
          </div>
        )}
        {failed > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-[var(--color-text-muted)]">
              Failed: {failed}
            </span>
          </div>
        )}
        {inProgress > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-[var(--color-text-muted)]">
              In Progress: {inProgress}
            </span>
          </div>
        )}
        {pending > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500/50" />
            <span className="text-[var(--color-text-muted)]">
              Pending: {pending}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

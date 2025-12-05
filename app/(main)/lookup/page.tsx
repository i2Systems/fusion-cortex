/**
 * Device Lookup Section
 * 
 * Main area: Search + results list.
 * Map panel: Highlights device location.
 * Details in right panel.
 * 
 * AI Note: I2QR details include build date, CCT, warranty status, parts list.
 * Global search from TopBar should integrate with this.
 */

'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { SearchIsland } from '@/components/layout/SearchIsland'
import { mockDevices, Device } from '@/lib/mockData'
import { Signal, Battery, Wifi, WifiOff } from 'lucide-react'

export default function LookupPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const selectedRowRef = useRef<HTMLTableRowElement>(null)

  const filteredDevices = useMemo(() => {
    // Show all devices by default, filter if search query exists
    if (!searchQuery.trim()) return mockDevices
    
    const query = searchQuery.toLowerCase().trim()
    return mockDevices.filter(device => 
      device.deviceId.toLowerCase().includes(query) ||
      device.serialNumber.toLowerCase().includes(query) ||
      device.location.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'fixture': return 'Fixture'
      case 'motion': return 'Motion Sensor'
      case 'light-sensor': return 'Light Sensor'
      default: return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-[var(--color-success)]'
      case 'offline': return 'text-[var(--color-warning)]'
      case 'missing': return 'text-[var(--color-danger)]'
      default: return 'text-[var(--color-text-muted)]'
    }
  }

  const getSignalColor = (signal: number) => {
    if (signal >= 80) return 'text-[var(--color-success)]'
    if (signal >= 50) return 'text-[var(--color-warning)]'
    return 'text-[var(--color-danger)]'
  }

  // Scroll to selected device when it changes
  useEffect(() => {
    if (selectedDevice && selectedRowRef.current && tableRef.current) {
      const row = selectedRowRef.current
      const container = tableRef.current
      const rowTop = row.offsetTop
      const rowBottom = rowTop + row.offsetHeight
      const containerTop = container.scrollTop
      const containerBottom = containerTop + container.offsetHeight

      // Only scroll if the row is not visible
      if (rowTop < containerTop || rowBottom > containerBottom) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [selectedDevice])

  return (
    <div className="h-full p-8 relative pb-32">
      {/* Results */}
      <div className="fusion-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-semibold text-[var(--color-text)]">
            All Devices
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            {filteredDevices.length} {searchQuery.trim() ? 'matching' : ''} device{filteredDevices.length !== 1 ? 's' : ''}
          </p>
        </div>
        {filteredDevices.length === 0 ? (
          <div className="text-sm text-[var(--color-text-muted)]">
            No devices found matching "{searchQuery}"
          </div>
        ) : (
          <div ref={tableRef} className="overflow-auto max-h-[60vh]">
            <table className="w-full">
              <thead className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)]">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Device ID
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Serial
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Signal
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Battery
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => (
                  <tr
                    key={device.id}
                    ref={selectedDevice?.id === device.id ? selectedRowRef : null}
                    onClick={() => setSelectedDevice(device)}
                    className={`
                      border-b border-[var(--color-border-subtle)] cursor-pointer transition-colors
                      ${selectedDevice?.id === device.id
                        ? 'bg-[var(--color-primary-soft)] hover:bg-[var(--color-primary-soft)] shadow-[var(--shadow-glow-primary)]'
                        : 'hover:bg-[var(--color-surface-subtle)]'
                      }
                    `}
                  >
                    <td className="py-3 px-4 text-sm text-[var(--color-text)] font-medium">
                      {device.deviceId}
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--color-text-muted)] font-mono">
                      {device.serialNumber}
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--color-text-muted)]">
                      {getTypeLabel(device.type)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {device.signal > 0 ? (
                          <Wifi size={16} className={getSignalColor(device.signal)} />
                        ) : (
                          <WifiOff size={16} className="text-[var(--color-text-muted)]" />
                        )}
                        <span className={`text-sm ${getSignalColor(device.signal)}`}>
                          {device.signal}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {device.battery !== undefined ? (
                        <div className="flex items-center gap-2">
                          <Battery size={16} className={device.battery > 20 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'} />
                          <span className="text-sm text-[var(--color-text-muted)]">
                            {device.battery}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--color-text-soft)]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-md bg-[var(--color-surface-subtle)] ${getStatusColor(device.status)}`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--color-text-muted)]">
                      {device.location}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Search Island */}
      <SearchIsland 
        position="bottom" 
        fullWidth={true}
        title="Device Lookup"
        subtitle="Search for devices by ID or serial number"
        placeholder="Enter device ID or serial number..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />
    </div>
  )
}


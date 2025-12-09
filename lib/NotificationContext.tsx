/**
 * Notification Context
 * 
 * Manages notifications system with fake notifications that link to
 * various parts of the app (discovery, zones, faults, BACnet, etc.)
 * 
 * AI Note: Notifications appear in the footer/BottomDrawer and link
 * to relevant pages in the app.
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { faultCategories, FaultCategory } from '@/lib/faultDefinitions'

export type NotificationType = 'discovery' | 'zone' | 'fault' | 'bacnet' | 'rule' | 'device' | 'system'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  link: string
  icon?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAsUnread: (id: string) => void
  markAllAsRead: () => void
  dismissNotification: (id: string) => void
  addNotification: (notification: Notification) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Generate a fault notification with realistic category examples
function generateFaultNotification(): Notification {
  const categories: FaultCategory[] = [
    'environmental-ingress',
    'electrical-driver',
    'thermal-overheat',
    'installation-wiring',
    'control-integration',
    'manufacturing-defect',
    'mechanical-structural',
    'optical-output',
  ]
  
  const category = categories[Math.floor(Math.random() * categories.length)]
  const categoryInfo = faultCategories[category]
  const example = categoryInfo.examples[Math.floor(Math.random() * categoryInfo.examples.length)]
  
  // Generate a device ID for the notification
  const deviceId = `FLX-${String(Math.floor(Math.random() * 2000) + 2000).padStart(4, '0')}`
  
  // Create realistic notification message
  const messages = [
    `${example}. Device ${deviceId} requires attention. ${categoryInfo.description.split('.')[0]}.`,
    `Device ${deviceId} shows ${categoryInfo.shortLabel.toLowerCase()} fault. ${example}.`,
    `${categoryInfo.label} detected on ${deviceId}. ${example}. Review troubleshooting steps.`,
    `Multiple devices showing ${categoryInfo.shortLabel.toLowerCase()} issues. ${deviceId} affected. ${example}.`,
  ]
  
  const titles = [
    `${categoryInfo.label} Detected`,
    `${categoryInfo.shortLabel} Fault`,
    `Device ${categoryInfo.shortLabel} Issue`,
    `${categoryInfo.shortLabel} Warning`,
  ]
  
  return {
    id: `fault-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'fault',
    title: titles[Math.floor(Math.random() * titles.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
    timestamp: new Date(),
    read: false,
    link: '/faults',
  }
}

// Generate a single random notification
function generateRandomNotification(): Notification {
  const now = new Date()
  const types: NotificationType[] = ['discovery', 'fault', 'zone', 'bacnet', 'rule', 'device', 'system']
  const type = types[Math.floor(Math.random() * types.length)]
  
  // Use specialized fault notification generator for fault type
  if (type === 'fault') {
    return generateFaultNotification()
  }
  
  const notifications: Record<NotificationType, { titles: string[], messages: string[], links: string[] }> = {
    discovery: {
      titles: [
        'Discovery Scan Completed',
        'New Devices Detected',
        'Background Scan Finished',
        'Network Discovery Update',
      ],
      messages: [
        'New devices discovered in the network. Review and map devices.',
        'Devices found during background scan. Map them to zones.',
        'Network scan completed. Review discovered devices.',
        'Additional devices detected. Update device inventory.',
      ],
      links: ['/discovery', '/map'],
    },
    fault: {
      titles: [
        'Environmental Ingress Detected',
        'Electrical Driver Failure',
        'Thermal Overheat Warning',
        'Installation Wiring Error',
        'Control System Integration Issue',
        'Manufacturing Defect Found',
        'Mechanical Hardware Problem',
        'Optical Output Abnormality',
        'Water Intrusion Detected',
        'Driver Burnout Failure',
        'Voltage Drop Issue',
        'DMX Control Problem',
      ],
      messages: [
        'Water intrusion detected in fixture housing. Device FLX-2041 shows signs of moisture damage. Inspect seals and gaskets.',
        'Legacy 6043 driver burnout - no power output. Device FLX-2085 requires driver replacement. Check warranty status.',
        'Input cable melting detected due to excessive current. Device FLX-2125 shows thermal stress. Review power distribution.',
        'Power landed on dim line instead of power line. Device FLX-2063 miswired during installation. Verify wiring diagram.',
        'GRX-TVI trim level issues causing incorrect dimming. Device FLX-2088 not responding to control signals. Check control module.',
        'Loose internal parts causing intermittent connection. Device FLX-2078 shows manufacturing defect. Document and contact manufacturer.',
        'Bezel detaching from fixture housing. Device FLX-2092 has structural mounting issue. Inspect bracket geometry.',
        'Single LED out in fixture array. Device FLX-2105 shows optical output abnormality. Check LED module connections.',
        'Condensation buildup causing repeat failures. Multiple devices in Zone 1 showing environmental ingress. Review IP ratings.',
        'DMX driver failing out-of-box with no response. Device FLX-2118 requires driver replacement. Test with known-good power supply.',
        'Voltage drop problems causing dimming and flicker. Device FLX-2130 experiencing power supply issues. Measure voltage at fixture.',
        'Reverse polarity on DMX decoder causing inverted dimming. Device FLX-2142 has control integration issue. Verify signal polarity.',
      ],
      links: ['/faults', '/lookup'],
    },
    zone: {
      titles: [
        'Zone Configuration Updated',
        'Zone Devices Changed',
        'Zone Mapping Modified',
      ],
      messages: [
        'Zone has been modified. Review zone settings.',
        'Devices in zone have changed. Update zone configuration.',
        'Zone boundaries updated. Verify device assignments.',
      ],
      links: ['/zones', '/map'],
    },
    bacnet: {
      titles: [
        'BACnet Connection Error',
        'BACnet Sync Completed',
        'BMS Integration Update',
      ],
      messages: [
        'Zone BACnet connection failed. Check BMS integration settings.',
        'BACnet synchronization completed successfully.',
        'Building Management System integration updated.',
      ],
      links: ['/bacnet'],
    },
    rule: {
      titles: [
        'Rule Triggered',
        'Rule Condition Met',
        'Automation Activated',
      ],
      messages: [
        'Motion Activation rule activated. View rule details.',
        'Rule condition satisfied. Automation executed.',
        'Scheduled rule triggered. Check zone status.',
      ],
      links: ['/rules'],
    },
    device: {
      titles: [
        'Device Signal Weak',
        'Device Status Changed',
        'Device Configuration Updated',
      ],
      messages: [
        'Device has low signal strength. Consider repositioning.',
        'Device status has changed. Review device details.',
        'Device configuration modified. Verify settings.',
      ],
      links: ['/lookup', '/map'],
    },
    system: {
      titles: [
        'System Health Check',
        'System Update Available',
        'Maintenance Reminder',
      ],
      messages: [
        'System health check completed. Some devices require attention.',
        'System update available. Review changelog.',
        'Scheduled maintenance window approaching.',
      ],
      links: ['/dashboard'],
    },
  }
  
  const templates = notifications[type]
  const titleIndex = Math.floor(Math.random() * templates.titles.length)
  const linkIndex = Math.floor(Math.random() * templates.links.length)
  
  return {
    id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: templates.titles[titleIndex],
    message: templates.messages[titleIndex],
    timestamp: now,
    read: false,
    link: templates.links[linkIndex],
  }
}

// Generate fake notifications
function generateFakeNotifications(): Notification[] {
  const now = new Date()
  
  return [
    {
      id: '1',
      type: 'discovery',
      title: 'Discovery Scan Completed',
      message: '205 new devices discovered in the network. Review and map devices.',
      timestamp: new Date(now.getTime() - 3 * 60 * 1000), // 3 minutes ago
      read: false,
      link: '/discovery',
    },
    {
      id: '2',
      type: 'fault',
      title: 'Environmental Ingress Detected',
      message: 'Water intrusion detected in fixture housing. Device FLX-2041 shows signs of moisture damage. Inspect seals and gaskets.',
      timestamp: new Date(now.getTime() - 15 * 60 * 1000), // 15 minutes ago
      read: false,
      link: '/faults',
    },
    {
      id: '3',
      type: 'zone',
      title: 'Zone Configuration Updated',
      message: 'Zone "Electronics - Aisle 1" has been modified. Review zone settings.',
      timestamp: new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
      read: false,
      link: '/zones',
    },
    {
      id: '4',
      type: 'bacnet',
      title: 'BACnet Connection Error',
      message: 'Zone "Grocery" BACnet connection failed. Check BMS integration settings.',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      link: '/bacnet',
    },
    {
      id: '5',
      type: 'rule',
      title: 'Rule Triggered',
      message: 'Motion Activation rule activated for Zone 2 - Clothing. View rule details.',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
      read: true,
      link: '/rules',
    },
    {
      id: '6',
      type: 'device',
      title: 'Device Signal Weak',
      message: 'FLX-2024 has low signal strength (56%). Consider repositioning or checking network.',
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: true,
      link: '/lookup',
    },
    {
      id: '7',
      type: 'system',
      title: 'System Health Check',
      message: 'System health is at 97%. 6 devices require attention.',
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
      read: true,
      link: '/dashboard',
    },
    {
      id: '8',
      type: 'discovery',
      title: 'New Devices Detected',
      message: '12 new devices found during background scan. Map them to zones.',
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
      read: true,
      link: '/map',
    },
    {
      id: '9',
      type: 'fault',
      title: 'Electrical Driver Failure',
      message: 'Legacy 6043 driver burnout - no power output. Device FLX-2085 requires driver replacement. Check warranty status.',
      timestamp: new Date(now.getTime() - 7 * 60 * 60 * 1000), // 7 hours ago
      read: true,
      link: '/faults',
    },
    {
      id: '10',
      type: 'fault',
      title: 'Installation Wiring Error',
      message: 'Power landed on dim line instead of power line. Device FLX-2063 miswired during installation. Verify wiring diagram.',
      timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000), // 8 hours ago
      read: true,
      link: '/faults',
    },
    {
      id: '11',
      type: 'fault',
      title: 'Control System Integration Issue',
      message: 'GRX-TVI trim level issues causing incorrect dimming. Device FLX-2088 not responding to control signals. Check control module.',
      timestamp: new Date(now.getTime() - 9 * 60 * 60 * 1000), // 9 hours ago
      read: true,
      link: '/faults',
    },
    {
      id: '12',
      type: 'fault',
      title: 'Thermal Overheat Warning',
      message: 'Input cable melting detected due to excessive current. Device FLX-2125 shows thermal stress. Review power distribution.',
      timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000), // 10 hours ago
      read: true,
      link: '/faults',
    },
  ]
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const router = useRouter()

  // Load notifications from localStorage or generate fake ones
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fusion_notifications')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setNotifications(parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          })))
        } catch (e) {
          // If parsing fails, generate new ones
          const fake = generateFakeNotifications()
          setNotifications(fake)
          localStorage.setItem('fusion_notifications', JSON.stringify(fake))
        }
      } else {
        const fake = generateFakeNotifications()
        setNotifications(fake)
        localStorage.setItem('fusion_notifications', JSON.stringify(fake))
      }
    }
  }, [])

  // Save to localStorage whenever notifications change
  useEffect(() => {
    if (typeof window !== 'undefined' && notifications.length > 0) {
      localStorage.setItem('fusion_notifications', JSON.stringify(notifications))
    }
  }, [notifications])

  // Auto-generate notifications periodically (every 30-60 seconds)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const interval = setInterval(() => {
      // 30% chance to generate a new notification each interval
      if (Math.random() < 0.3) {
        const newNotification = generateRandomNotification()
        setNotifications(prev => [newNotification, ...prev])
      }
    }, 30000 + Math.random() * 30000) // 30-60 seconds

    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAsUnread = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: false } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev])
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      dismissNotification,
      addNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}


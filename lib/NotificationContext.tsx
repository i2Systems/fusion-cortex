/**
 * Notification Context
 * 
 * Manages notifications system with real data from the backend.
 * Links to relevant parts of the app (faults, warranty lookup, etc.)
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from './trpc/client'

export type NotificationType = 'zone' | 'fault' | 'bacnet' | 'rule' | 'device' | 'system' | 'warranty'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  link: string
  icon?: string
  siteId?: string
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

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Track read notification IDs in local storage
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  // Fetch notifications from server
  const { data: serverNotifications } = trpc.notification.list.useQuery(
    {},
    {
      refetchInterval: 30000, // Poll every 30s
      refetchOnWindowFocus: true,
    }
  )

  // Load read state from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedReadIds = localStorage.getItem('fusion_read_notifications')
      if (savedReadIds) {
        try {
          const parsed = JSON.parse(savedReadIds)
          setReadIds(new Set(parsed))
        } catch (e) {
          console.error('Failed to parse read notifications:', e)
        }
      }
    }
  }, [])

  // Sync server data to local state, applying read status
  useEffect(() => {
    if (serverNotifications) {
      const mapped = serverNotifications.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp), // Ensure date object
        read: readIds.has(n.id),
      })) as Notification[]

      setNotifications(mapped)
    }
  }, [serverNotifications, readIds])

  // Save read IDs when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fusion_read_notifications', JSON.stringify(Array.from(readIds)))
    }
  }, [readIds])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const markAsUnread = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id)
    setReadIds(prev => {
      const next = new Set(prev)
      allIds.forEach(id => next.add(id))
      return next
    })
  }

  const dismissNotification = (id: string) => {
    // Local dismissal logic: just hide it for now
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

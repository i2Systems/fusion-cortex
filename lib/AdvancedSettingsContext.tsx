/**
 * Advanced Settings Context
 * 
 * Stores advanced/experimental settings like:
 * - SVG vector extraction toggle for PDF uploads
 * 
 * AI Note: These settings are persisted in localStorage.
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AdvancedSettings {
  /** Whether to attempt SVG/vector extraction from PDFs (can be slow/buggy) */
  enableSVGExtraction: boolean
}

interface AdvancedSettingsContextType extends AdvancedSettings {
  setEnableSVGExtraction: (enabled: boolean) => void
}

const defaultSettings: AdvancedSettings = {
  enableSVGExtraction: false, // Disabled by default - focus on raster
}

const AdvancedSettingsContext = createContext<AdvancedSettingsContextType | undefined>(undefined)

const STORAGE_KEY = 'fusion-advanced-settings'

export function AdvancedSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AdvancedSettings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch (e) {
      console.warn('Failed to load advanced settings:', e)
    }
    setIsLoaded(true)
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      } catch (e) {
        console.warn('Failed to save advanced settings:', e)
      }
    }
  }, [settings, isLoaded])

  const setEnableSVGExtraction = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, enableSVGExtraction: enabled }))
  }

  return (
    <AdvancedSettingsContext.Provider
      value={{
        ...settings,
        setEnableSVGExtraction,
      }}
    >
      {children}
    </AdvancedSettingsContext.Provider>
  )
}

export function useAdvancedSettings() {
  const context = useContext(AdvancedSettingsContext)
  if (context === undefined) {
    throw new Error('useAdvancedSettings must be used within an AdvancedSettingsProvider')
  }
  return context
}


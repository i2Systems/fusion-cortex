/**
 * Zoom Context
 * 
 * Provides zoom state from map canvas to other components like BottomDrawer.
 * Tracks current zoom level, whether user is actively zooming, and generic interaction hints.
 */

'use client'

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'

interface ZoomContextType {
    zoomLevel: number
    isZooming: boolean
    setZoomLevel: (level: number) => void
    triggerZoomIndicator: () => void
    interactionHint: string | null
    setInteractionHint: (hint: string | null) => void
    modeHint: string | null
    setModeHint: (hint: string | null) => void
}

const ZoomContext = createContext<ZoomContextType | undefined>(undefined)

export function ZoomProvider({ children }: { children: ReactNode }) {
    const [zoomLevel, setZoomLevelState] = useState(100)
    const [isZooming, setIsZooming] = useState(false)
    const [interactionHint, setInteractionHint] = useState<string | null>(null)
    const [modeHint, setModeHint] = useState<string | null>(null)
    const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const setZoomLevel = useCallback((level: number) => {
        setZoomLevelState(Math.round(level * 100))
    }, [])

    const triggerZoomIndicator = useCallback(() => {
        setIsZooming(true)

        // Clear existing timeout
        if (zoomTimeoutRef.current) {
            clearTimeout(zoomTimeoutRef.current)
        }

        // Hide after 2 seconds of inactivity
        zoomTimeoutRef.current = setTimeout(() => {
            setIsZooming(false)
        }, 2000)
    }, [])

    return (
        <ZoomContext.Provider value={{ zoomLevel, isZooming, setZoomLevel, triggerZoomIndicator, interactionHint, setInteractionHint, modeHint, setModeHint }}>
            {children}
        </ZoomContext.Provider>
    )
}

export function useZoomContext() {
    const context = useContext(ZoomContext)
    if (!context) {
        // Return default values if not in provider (e.g., on non-map pages)
        return {
            zoomLevel: 100,
            isZooming: false,
            setZoomLevel: () => { },
            triggerZoomIndicator: () => { },
            interactionHint: null,
            setInteractionHint: () => { },
            modeHint: null,
            setModeHint: () => { }
        }
    }
    return context
}

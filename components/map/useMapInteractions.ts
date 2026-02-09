/**
 * Map Interactions Hook
 *
 * Handles keyboard and mouse event logic for the map canvas.
 * Manages shift/space key state, keyboard navigation, and zoom shortcuts.
 * Extracted from MapCanvas.tsx for modularity.
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { DevicePoint, MapMode, SelectionState, DraggedDeviceState } from './mapTypes'

interface UseMapInteractionsProps {
    mode: MapMode
    selectedDeviceId: string | null
    selectedDeviceIds: string[]
    sortedDevices: DevicePoint[]
    effectiveScale: number
    stageRef: React.RefObject<any>
    onDeviceSelect?: (deviceId: string | null) => void
    onDevicesSelect?: (deviceIds: string[]) => void
    setScale: (scale: number) => void
    setInteractionHint: (hint: string | null) => void
}

interface UseMapInteractionsReturn {
    isShiftHeld: boolean
    isSpaceHeld: boolean
    isSelecting: boolean
    selectionStart: { x: number; y: number } | null
    selectionEnd: { x: number; y: number } | null
    draggedDevice: DraggedDeviceState | null
    setIsShiftHeld: (value: boolean) => void
    setIsSpaceHeld: (value: boolean) => void
    setIsSelecting: (value: boolean) => void
    setSelectionStart: (value: { x: number; y: number } | null) => void
    setSelectionEnd: (value: { x: number; y: number } | null) => void
    setDraggedDevice: (value: DraggedDeviceState | null) => void
    clearSelection: () => void
}

export function useMapInteractions({
    mode,
    selectedDeviceId,
    selectedDeviceIds,
    sortedDevices,
    effectiveScale,
    stageRef,
    onDeviceSelect,
    onDevicesSelect,
    setScale,
    setInteractionHint,
}: UseMapInteractionsProps): UseMapInteractionsReturn {
    const [isShiftHeld, setIsShiftHeld] = useState(false)
    const [isSpaceHeld, setIsSpaceHeld] = useState(false)
    const [isSelecting, setIsSelecting] = useState(false)
    const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null)
    const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null)
    const [draggedDevice, setDraggedDevice] = useState<DraggedDeviceState | null>(null)

    const clearSelection = useCallback(() => {
        onDevicesSelect?.([])
        onDeviceSelect?.(null)
        setDraggedDevice(null)
        setIsSelecting(false)
        setSelectionStart(null)
        setSelectionEnd(null)
    }, [onDeviceSelect, onDevicesSelect])

    // Track Shift key state
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift' || e.shiftKey) {
                setIsShiftHeld(true)
                if (stageRef.current) {
                    const container = stageRef.current.container()
                    if (container) {
                        container.style.cursor = 'crosshair'
                    }
                }
            }
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Shift' || (!e.shiftKey && isShiftHeld)) {
                setIsShiftHeld(false)
                if (stageRef.current) {
                    const container = stageRef.current.container()
                    if (container) {
                        container.style.cursor = 'default'
                    }
                }
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (e.shiftKey !== isShiftHeld) {
                setIsShiftHeld(e.shiftKey)
                if (stageRef.current) {
                    const container = stageRef.current.container()
                    if (container) {
                        container.style.cursor = e.shiftKey ? 'crosshair' : 'default'
                    }
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        window.addEventListener('mousemove', handleMouseMove)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
            window.removeEventListener('mousemove', handleMouseMove)
        }
    }, [isSelecting, isShiftHeld, stageRef])

    // Keyboard navigation: up/down arrows for device selection
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedDeviceId || sortedDevices.length === 0) return
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return

            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault()
                const currentIndex = sortedDevices.findIndex((d) => d.id === selectedDeviceId)
                if (currentIndex === -1) return

                let newIndex: number
                if (e.key === 'ArrowDown') {
                    newIndex = currentIndex < sortedDevices.length - 1 ? currentIndex + 1 : currentIndex
                } else {
                    newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex
                }

                if (newIndex !== currentIndex) {
                    onDeviceSelect?.(sortedDevices[newIndex].id)
                    if (onDevicesSelect) {
                        onDevicesSelect([sortedDevices[newIndex].id])
                    }
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedDeviceId, sortedDevices, onDeviceSelect, onDevicesSelect])

    // Keyboard shortcuts: Escape, +/-, Space for pan
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return

            if (e.key === 'Escape' && mode === 'select') {
                clearSelection()
            }

            // Zoom with +/- keys
            if ((e.key === '+' || e.key === '=') && !e.shiftKey) {
                e.preventDefault()
                const newScale = Math.min(10, effectiveScale * 1.2)
                setScale(newScale)
            }
            if (e.key === '-' || e.key === '_') {
                e.preventDefault()
                const newScale = Math.max(0.1, effectiveScale * 0.8)
                setScale(newScale)
            }

            // Space key for panning
            if (e.key === ' ' && mode === 'select' && !isSpaceHeld) {
                e.preventDefault()
                setIsSpaceHeld(true)
                if (stageRef.current) {
                    const container = stageRef.current.container()
                    if (container) {
                        container.style.cursor = 'grab'
                    }
                }
            }
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === ' ' && isSpaceHeld) {
                e.preventDefault()
                setIsSpaceHeld(false)
                if (stageRef.current) {
                    const container = stageRef.current.container()
                    if (container) {
                        container.style.cursor = isShiftHeld ? 'crosshair' : 'default'
                    }
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [mode, effectiveScale, setScale, isSpaceHeld, isShiftHeld, clearSelection, stageRef])

    // Update interaction hint based on held keys
    useEffect(() => {
        if (isSpaceHeld && mode === 'select') {
            setInteractionHint('Hold key + Drag to pan • Scroll or +/- to zoom')
        } else if (isShiftHeld && mode === 'select' && !isSelecting) {
            setInteractionHint('Drag to select multiple devices')
        } else {
            setInteractionHint(null)
        }
    }, [isSpaceHeld, isShiftHeld, mode, isSelecting, setInteractionHint])

    return {
        isShiftHeld,
        isSpaceHeld,
        isSelecting,
        selectionStart,
        selectionEnd,
        draggedDevice,
        setIsShiftHeld,
        setIsSpaceHeld,
        setIsSelecting,
        setSelectionStart,
        setSelectionEnd,
        setDraggedDevice,
        clearSelection,
    }
}

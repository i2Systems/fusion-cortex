/**
 * Device Store (Zustand)
 * 
 * Replaces DeviceContext with a Zustand store for better render performance.
 * 
 * Key features:
 * - Selective subscriptions (components only re-render for data they use)
 * - Built-in undo/redo via immer middleware
 * - Compatible with existing tRPC mutations
 * 
 * AI Note: This store holds UI state. tRPC mutations are handled via
 * useDeviceSync hook which hydrates this store from the server.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Device } from '@/lib/mockData'

// History for undo/redo
interface HistoryState {
    past: Device[][]
    future: Device[][]
}

interface DeviceState {
    devices: Device[]
    isLoading: boolean
    error: unknown | null

    // History for undo/redo
    _history: HistoryState

    // Actions
    setDevices: (devices: Device[]) => void
    setLoading: (loading: boolean) => void
    setError: (error: unknown | null) => void

    addDevice: (device: Device) => void
    updateDevice: (deviceId: string, updates: Partial<Device>) => void
    updateDevicePosition: (deviceId: string, x: number, y: number) => void
    updateMultipleDevices: (updates: Array<{ deviceId: string; updates: Partial<Device> }>) => void
    removeDevice: (deviceId: string) => void
    removeMultipleDevices: (deviceIds: string[]) => void

    // Undo/Redo
    undo: () => void
    redo: () => void
    canUndo: () => boolean
    canRedo: () => boolean

    // Internal: save to history before changes
    _pushHistory: () => void
}

const MAX_HISTORY = 50

export const useDeviceStore = create<DeviceState>()(
    immer((set, get) => ({
        devices: [],
        isLoading: false,
        error: null,

        _history: {
            past: [],
            future: [],
        },

        setDevices: (devices) =>
            set((state) => {
                state.devices = devices
                // Reset history when data is loaded from server
                state._history = { past: [], future: [] }
            }),

        setLoading: (loading) =>
            set((state) => {
                state.isLoading = loading
            }),

        setError: (error) =>
            set((state) => {
                state.error = error
            }),

        _pushHistory: () =>
            set((state) => {
                // Push current devices to past, clear future
                state._history.past.push([...state.devices])
                if (state._history.past.length > MAX_HISTORY) {
                    state._history.past.shift()
                }
                state._history.future = []
            }),

        addDevice: (device) =>
            set((state) => {
                const existingIndex = state.devices.findIndex(
                    (d) => d.id === device.id || d.serialNumber === device.serialNumber
                )

                if (existingIndex >= 0) {
                    // Update existing
                    state.devices[existingIndex] = { ...state.devices[existingIndex], ...device }
                } else {
                    state.devices.push(device)
                }
            }),

        updateDevice: (deviceId, updates) => {
            get()._pushHistory()
            set((state) => {
                const index = state.devices.findIndex((d) => d.id === deviceId)
                if (index >= 0) {
                    state.devices[index] = { ...state.devices[index], ...updates }
                }
            })
        },

        updateDevicePosition: (deviceId, x, y) =>
            // Position updates don't push to history (too granular during drag)
            set((state) => {
                const index = state.devices.findIndex((d) => d.id === deviceId)
                if (index >= 0) {
                    state.devices[index].x = x
                    state.devices[index].y = y
                }
            }),

        updateMultipleDevices: (updates) => {
            get()._pushHistory()
            set((state) => {
                updates.forEach(({ deviceId, updates: deviceUpdates }) => {
                    const index = state.devices.findIndex((d) => d.id === deviceId)
                    if (index >= 0) {
                        state.devices[index] = { ...state.devices[index], ...deviceUpdates }
                    }
                })
            })
        },

        removeDevice: (deviceId) => {
            get()._pushHistory()
            set((state) => {
                state.devices = state.devices.filter((d) => d.id !== deviceId)
            })
        },

        removeMultipleDevices: (deviceIds) => {
            get()._pushHistory()
            set((state) => {
                state.devices = state.devices.filter((d) => !deviceIds.includes(d.id))
            })
        },

        undo: () =>
            set((state) => {
                if (state._history.past.length === 0) return

                const previous = state._history.past.pop()!
                state._history.future.push([...state.devices])
                state.devices = previous
            }),

        redo: () =>
            set((state) => {
                if (state._history.future.length === 0) return

                const next = state._history.future.pop()!
                state._history.past.push([...state.devices])
                state.devices = next
            }),

        canUndo: () => get()._history.past.length > 0,
        canRedo: () => get()._history.future.length > 0,
    }))
)

// Convenience selectors for optimized subscriptions
export const useDevices = () => useDeviceStore((s) => s.devices)
export const useDevicesLoading = () => useDeviceStore((s) => s.isLoading)
export const useDevicesError = () => useDeviceStore((s) => s.error)

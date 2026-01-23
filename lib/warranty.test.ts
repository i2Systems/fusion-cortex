import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
    calculateWarrantyStatus,
    getWarrantyStatusLabel,
    getWarrantyStatusColor,
    getWarrantyStatusTokenClass,
    formatWarrantyExpiry,
    WarrantyStatus
} from './warranty'

describe('warranty', () => {
    // Mock current date for consistent tests
    const mockDate = new Date('2026-01-22T12:00:00Z')

    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(mockDate)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe('calculateWarrantyStatus', () => {
        it('should return out-of-warranty for null expiry', () => {
            const result = calculateWarrantyStatus(null)
            expect(result.status).toBe('out-of-warranty')
            expect(result.expiryDate).toBeNull()
            expect(result.daysRemaining).toBeNull()
            expect(result.isExpired).toBe(true)
            expect(result.isNearEnd).toBe(false)
        })

        it('should return out-of-warranty for undefined expiry', () => {
            const result = calculateWarrantyStatus(undefined)
            expect(result.status).toBe('out-of-warranty')
            expect(result.isExpired).toBe(true)
        })

        it('should return in-warranty for future expiry date', () => {
            const futureDate = new Date('2027-06-15')
            const result = calculateWarrantyStatus(futureDate)
            expect(result.status).toBe('in-warranty')
            expect(result.isExpired).toBe(false)
            expect(result.isNearEnd).toBe(false)
            expect(result.daysRemaining).toBeGreaterThan(30)
        })

        it('should return out-of-warranty for past expiry date', () => {
            const pastDate = new Date('2025-01-01')
            const result = calculateWarrantyStatus(pastDate)
            expect(result.status).toBe('out-of-warranty')
            expect(result.isExpired).toBe(true)
            expect(result.daysRemaining).toBeNull()
        })

        it('should return near-end for expiry within 30 days', () => {
            const nearEndDate = new Date('2026-02-10') // ~19 days from mock date
            const result = calculateWarrantyStatus(nearEndDate)
            expect(result.status).toBe('near-end')
            expect(result.isExpired).toBe(false)
            expect(result.isNearEnd).toBe(true)
            expect(result.daysRemaining).toBeGreaterThan(0)
            expect(result.daysRemaining).toBeLessThanOrEqual(30)
        })

        it('should respect custom nearEndDays threshold', () => {
            const date45DaysOut = new Date('2026-03-08') // ~45 days from mock date

            // With default 30 days, should be in-warranty
            const defaultResult = calculateWarrantyStatus(date45DaysOut)
            expect(defaultResult.status).toBe('in-warranty')

            // With custom 60 days, should be near-end
            const customResult = calculateWarrantyStatus(date45DaysOut, 60)
            expect(customResult.status).toBe('near-end')
        })

        it('should correctly calculate days remaining', () => {
            const exactlyOneYearAway = new Date('2027-01-22')
            const result = calculateWarrantyStatus(exactlyOneYearAway)
            expect(result.daysRemaining).toBe(365) // Leap year adjustment may vary
        })

        it('should handle edge case of expiry today', () => {
            const today = new Date('2026-01-22T12:00:00Z')
            const result = calculateWarrantyStatus(today)
            expect(result.status).toBe('near-end')
            // Days remaining could be 0 or -0, both are valid
            expect(Math.abs(result.daysRemaining!)).toBeLessThanOrEqual(1)
            expect(result.isExpired).toBe(false)
        })
    })

    describe('getWarrantyStatusLabel', () => {
        it('should return correct labels for all statuses', () => {
            expect(getWarrantyStatusLabel('in-warranty')).toBe('In Warranty')
            expect(getWarrantyStatusLabel('out-of-warranty')).toBe('Out of Warranty')
            expect(getWarrantyStatusLabel('near-end')).toBe('Near End')
        })

        it('should return Unknown for invalid status', () => {
            expect(getWarrantyStatusLabel('invalid' as WarrantyStatus)).toBe('Unknown')
        })
    })

    describe('getWarrantyStatusColor', () => {
        it('should return success color for in-warranty', () => {
            expect(getWarrantyStatusColor('in-warranty')).toContain('success')
        })

        it('should return danger color for out-of-warranty', () => {
            expect(getWarrantyStatusColor('out-of-warranty')).toContain('danger')
        })

        it('should return warning color for near-end', () => {
            expect(getWarrantyStatusColor('near-end')).toContain('warning')
        })
    })

    describe('getWarrantyStatusTokenClass', () => {
        it('should return token classes for all statuses', () => {
            expect(getWarrantyStatusTokenClass('in-warranty')).toContain('token')
            expect(getWarrantyStatusTokenClass('out-of-warranty')).toContain('token')
            expect(getWarrantyStatusTokenClass('near-end')).toContain('token')
        })

        it('should include status-specific class names', () => {
            expect(getWarrantyStatusTokenClass('in-warranty')).toContain('in-warranty')
            expect(getWarrantyStatusTokenClass('out-of-warranty')).toContain('out-of-warranty')
            expect(getWarrantyStatusTokenClass('near-end')).toContain('near-end')
        })
    })

    describe('formatWarrantyExpiry', () => {
        it('should return "No warranty" for null/undefined', () => {
            expect(formatWarrantyExpiry(null)).toBe('No warranty')
            expect(formatWarrantyExpiry(undefined)).toBe('No warranty')
        })

        it('should format date correctly', () => {
            // Use specific time to avoid timezone issues
            const date = new Date('2026-06-15T12:00:00Z')
            const result = formatWarrantyExpiry(date)
            expect(result).toContain('Jun')
            expect(result).toContain('2026')
            // Day could be 14 or 15 depending on timezone
            expect(result).toMatch(/Jun (14|15), 2026/)
        })

        it('should handle Date objects', () => {
            const date = new Date('2025-12-25T00:00:00Z')
            const result = formatWarrantyExpiry(date)
            expect(result).toContain('Dec')
            expect(result).toContain('2025')
        })
    })
})

import { describe, it, expect } from 'vitest'
import { generateComponentsForFixture, generateWarrantyExpiry } from './deviceUtils'

describe('deviceUtils', () => {
    describe('generateComponentsForFixture', () => {
        const fixtureId = 'fixture-test-001'
        const fixtureSerial = 'FIX-12345'

        it('should generate correct number of components (18 total)', () => {
            const components = generateComponentsForFixture(fixtureId, fixtureSerial)

            // Count expected: LCM(1) + Driver(1) + Power(2) + LED(4) + Bracket(2) + Cable(2) + Housing(4) + Sensor(2) = 18
            expect(components).toHaveLength(18)
        })

        it('should generate all required component types', () => {
            const components = generateComponentsForFixture(fixtureId, fixtureSerial)
            const types = components.map(c => c.componentType)

            // Check for each component type
            expect(types.filter(t => t.startsWith('LCM'))).toHaveLength(1)
            expect(types.filter(t => t.startsWith('Driver Board'))).toHaveLength(1)
            expect(types.filter(t => t.startsWith('Power Supply'))).toHaveLength(2)
            expect(types.filter(t => t.startsWith('LED Board'))).toHaveLength(4)
            expect(types.filter(t => t.startsWith('Metal Bracket'))).toHaveLength(2)
            expect(types.filter(t => t.startsWith('Cable Harness'))).toHaveLength(2)
            expect(types.filter(t => t.startsWith('Lower LED Housing'))).toHaveLength(4)
            expect(types.filter(t => t.startsWith('Sensor'))).toHaveLength(2)
        })

        it('should generate unique component IDs', () => {
            const components = generateComponentsForFixture(fixtureId, fixtureSerial)
            const ids = components.map(c => c.id)
            const uniqueIds = new Set(ids)
            expect(uniqueIds.size).toBe(components.length)
        })

        it('should generate serial numbers with fixture serial prefix', () => {
            const components = generateComponentsForFixture(fixtureId, fixtureSerial)

            components.forEach(component => {
                expect(component.componentSerialNumber).toContain(fixtureSerial)
            })
        })

        it('should assign valid warranty statuses', () => {
            const components = generateComponentsForFixture(fixtureId, fixtureSerial)

            components.forEach(component => {
                expect(['Active', 'Expired']).toContain(component.warrantyStatus)
            })
        })

        it('should generate components with build dates', () => {
            const components = generateComponentsForFixture(fixtureId, fixtureSerial)

            components.forEach(component => {
                expect(component.buildDate).toBeInstanceOf(Date)
            })
        })

        it('should generate components with warranty expiry dates', () => {
            const components = generateComponentsForFixture(fixtureId, fixtureSerial)

            components.forEach(component => {
                expect(component.warrantyExpiry).toBeInstanceOf(Date)
            })
        })

        it('should generate components with valid status', () => {
            const components = generateComponentsForFixture(fixtureId, fixtureSerial)

            components.forEach(component => {
                expect(['online', 'offline']).toContain(component.status)
            })
        })

        it('should generate numbered component types for quantities > 1', () => {
            const components = generateComponentsForFixture(fixtureId, fixtureSerial)

            // Power supplies should be numbered
            const powerSupplies = components.filter(c => c.componentType.startsWith('Power Supply'))
            expect(powerSupplies.map(p => p.componentType)).toContain('Power Supply 1')
            expect(powerSupplies.map(p => p.componentType)).toContain('Power Supply 2')

            // LCM should NOT be numbered (quantity = 1)
            const lcm = components.find(c => c.componentType === 'LCM')
            expect(lcm).toBeDefined()
        })
    })

    describe('generateWarrantyExpiry', () => {
        it('should return a Date object', () => {
            const expiry = generateWarrantyExpiry()
            expect(expiry).toBeInstanceOf(Date)
        })

        it('should return a date approximately 5 years in the future', () => {
            const now = new Date()
            const expiry = generateWarrantyExpiry()

            // Should be between 4.9 and 5.1 years from now
            const yearsFromNow = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365)
            expect(yearsFromNow).toBeGreaterThan(4.9)
            expect(yearsFromNow).toBeLessThan(5.1)
        })

        it('should return a future date', () => {
            const now = new Date()
            const expiry = generateWarrantyExpiry()
            expect(expiry.getTime()).toBeGreaterThan(now.getTime())
        })
    })
})

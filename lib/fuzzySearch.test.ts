import { describe, it, expect } from 'vitest'
import {
    levenshteinDistance,
    similarity,
    fuzzyMatch,
    scoreMatch,
    fuzzySearch,
    SearchableItem
} from './fuzzySearch'

describe('fuzzySearch', () => {
    describe('levenshteinDistance', () => {
        it('should return 0 for identical strings', () => {
            expect(levenshteinDistance('hello', 'hello')).toBe(0)
            expect(levenshteinDistance('', '')).toBe(0)
        })

        it('should return string length for empty vs non-empty', () => {
            expect(levenshteinDistance('hello', '')).toBe(5)
            expect(levenshteinDistance('', 'world')).toBe(5)
        })

        it('should calculate single character difference', () => {
            expect(levenshteinDistance('cat', 'bat')).toBe(1)
            expect(levenshteinDistance('cat', 'cats')).toBe(1)
            expect(levenshteinDistance('cat', 'ca')).toBe(1)
        })

        it('should handle transpositions', () => {
            expect(levenshteinDistance('ab', 'ba')).toBe(2) // swap = delete + insert
        })

        it('should calculate complex differences', () => {
            expect(levenshteinDistance('kitten', 'sitting')).toBe(3)
            expect(levenshteinDistance('saturday', 'sunday')).toBe(3)
        })
    })

    describe('similarity', () => {
        it('should return 1 for identical strings', () => {
            expect(similarity('hello', 'hello')).toBe(1)
        })

        it('should return 1 for empty strings', () => {
            expect(similarity('', '')).toBe(1)
        })

        it('should be case insensitive', () => {
            expect(similarity('Hello', 'hello')).toBe(1)
            expect(similarity('WORLD', 'world')).toBe(1)
        })

        it('should return 0 for completely different strings of same length', () => {
            expect(similarity('abc', 'xyz')).toBe(0)
        })

        it('should return partial similarity for similar strings', () => {
            const sim = similarity('cat', 'bat')
            expect(sim).toBeGreaterThan(0.5) // 2/3 similar
            expect(sim).toBeLessThan(1)
        })
    })

    describe('fuzzyMatch', () => {
        it('should return true for exact match', () => {
            expect(fuzzyMatch('hello', 'hello')).toBe(true)
        })

        it('should return true for contains match', () => {
            expect(fuzzyMatch('ell', 'hello')).toBe(true)
            expect(fuzzyMatch('wor', 'hello world')).toBe(true)
        })

        it('should be case insensitive', () => {
            expect(fuzzyMatch('HELLO', 'hello')).toBe(true)
            expect(fuzzyMatch('hello', 'HELLO WORLD')).toBe(true)
        })

        it('should return false for empty query or text', () => {
            expect(fuzzyMatch('', 'hello')).toBe(false)
            expect(fuzzyMatch('hello', '')).toBe(false)
        })

        it('should return true for fuzzy match above threshold', () => {
            // "helo" is similar to "hello" (1 char missing)
            expect(fuzzyMatch('helo', 'hello', 0.6)).toBe(true)
        })

        it('should return false for fuzzy match below threshold', () => {
            expect(fuzzyMatch('xyz', 'hello', 0.6)).toBe(false)
        })
    })

    describe('scoreMatch', () => {
        it('should return 100 for exact match', () => {
            expect(scoreMatch('hello', 'hello')).toBe(100)
        })

        it('should return 80 for starts with match', () => {
            expect(scoreMatch('hel', 'hello')).toBe(80)
        })

        it('should return 60 for contains match', () => {
            expect(scoreMatch('ell', 'hello')).toBe(60)
        })

        it('should return 0 for empty query or text', () => {
            expect(scoreMatch('', 'hello')).toBe(0)
            expect(scoreMatch('hello', '')).toBe(0)
        })

        it('should return fuzzy score for similar strings', () => {
            const score = scoreMatch('helo', 'hello')
            expect(score).toBeGreaterThan(0)
            expect(score).toBeLessThan(60) // Less than contains score
        })

        it('should return 0 for completely different strings', () => {
            expect(scoreMatch('xyz', 'hello')).toBe(0)
        })
    })

    describe('fuzzySearch', () => {
        const items: SearchableItem[] = [
            { id: '1', deviceId: 'DEV-001', serialNumber: 'SN12345', location: 'Building A' },
            { id: '2', deviceId: 'DEV-002', serialNumber: 'SN12346', location: 'Building B' },
            { id: '3', deviceId: 'DEV-100', serialNumber: 'SN99999', location: 'Warehouse' },
            { id: '4', deviceId: 'SENSOR-01', serialNumber: 'SS00001', type: 'motion' },
        ]

        it('should return empty array for empty query', () => {
            expect(fuzzySearch('', items)).toEqual([])
            expect(fuzzySearch('   ', items)).toEqual([])
        })

        it('should find exact matches', () => {
            const results = fuzzySearch('DEV-001', items)
            expect(results.length).toBeGreaterThanOrEqual(1)
            // First result should be exact match with score 100
            expect(results[0].item.id).toBe('1')
            expect(results[0].score).toBe(100)
        })

        it('should find partial matches', () => {
            const results = fuzzySearch('DEV', items)
            expect(results.length).toBeGreaterThan(0)
            // Should find all DEV-xxx devices
            const devIds = results.map(r => r.item.deviceId)
            expect(devIds).toContain('DEV-001')
            expect(devIds).toContain('DEV-002')
        })

        it('should rank results by score (highest first)', () => {
            const results = fuzzySearch('Building', items)
            expect(results.length).toBeGreaterThanOrEqual(2)
            // Scores should be in descending order
            for (let i = 1; i < results.length; i++) {
                expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
            }
        })

        it('should include matched fields in results', () => {
            const results = fuzzySearch('SN12345', items)
            expect(results.length).toBeGreaterThanOrEqual(1)
            // Top result should match on serialNumber
            expect(results[0].matchedFields).toContain('serialNumber')
        })

        it('should search across multiple fields', () => {
            const results = fuzzySearch('motion', items)
            expect(results).toHaveLength(1)
            expect(results[0].item.id).toBe('4')
            expect(results[0].matchedFields).toContain('type')
        })

        it('should respect minScore threshold', () => {
            // With high minScore, should filter out weak matches
            const strictResults = fuzzySearch('DEV', items, ['deviceId'], 80)
            const looseResults = fuzzySearch('DEV', items, ['deviceId'], 20)
            expect(strictResults.length).toBeLessThanOrEqual(looseResults.length)
        })
    })
})

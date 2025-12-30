/**
 * Fuzzy Search Utilities
 * 
 * Provides Levenshtein distance calculation and fuzzy matching
 * for device IDs, serial numbers, and other searchable fields.
 * 
 * AI Note: This enables smart search with typo tolerance.
 */

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  
  // Create matrix
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0))
  
  // Initialize first row and column
  for (let i = 0; i <= len1; i++) matrix[i][0] = i
  for (let j = 0; j <= len2; j++) matrix[0][j] = j
  
  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }
  
  return matrix[len1][len2]
}

/**
 * Calculate similarity score (0-1, where 1 is exact match)
 */
export function similarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  return 1 - distance / maxLen
}

/**
 * Fuzzy match with threshold
 */
export function fuzzyMatch(
  query: string,
  text: string,
  threshold: number = 0.6
): boolean {
  if (!query || !text) return false
  
  const lowerQuery = query.toLowerCase()
  const lowerText = text.toLowerCase()
  
  // Exact match
  if (lowerText === lowerQuery) return true
  
  // Contains match (high priority)
  if (lowerText.includes(lowerQuery)) return true
  
  // Fuzzy match using similarity
  const sim = similarity(lowerQuery, lowerText)
  return sim >= threshold
}

/**
 * Score a match for ranking (higher = better match)
 */
export function scoreMatch(
  query: string,
  text: string,
  field: string = ''
): number {
  if (!query || !text) return 0
  
  const lowerQuery = query.toLowerCase()
  const lowerText = text.toLowerCase()
  
  // Exact match = 100
  if (lowerText === lowerQuery) return 100
  
  // Starts with = 80
  if (lowerText.startsWith(lowerQuery)) return 80
  
  // Contains = 60
  if (lowerText.includes(lowerQuery)) return 60
  
  // Fuzzy match = similarity * 40
  const sim = similarity(lowerQuery, lowerText)
  if (sim >= 0.6) return sim * 40
  
  return 0
}

/**
 * Search through items with fuzzy matching
 */
export interface SearchableItem {
  id: string
  deviceId?: string
  serialNumber?: string
  location?: string
  zone?: string
  type?: string
  status?: string
  [key: string]: any
}

export interface SearchResult<T extends SearchableItem> {
  item: T
  score: number
  matchedFields: string[]
}

export function fuzzySearch<T extends SearchableItem>(
  query: string,
  items: T[],
  searchFields: string[] = ['deviceId', 'serialNumber', 'location', 'zone', 'type', 'status'],
  minScore: number = 20
): SearchResult<T>[] {
  if (!query.trim()) return []
  
  const results: SearchResult<T>[] = []
  
  for (const item of items) {
    let maxScore = 0
    const matchedFields: string[] = []
    
    for (const field of searchFields) {
      const value = item[field]
      if (!value) continue
      
      const fieldScore = scoreMatch(query, String(value), field)
      if (fieldScore > 0) {
        maxScore = Math.max(maxScore, fieldScore)
        matchedFields.push(field)
      }
    }
    
    if (maxScore >= minScore) {
      results.push({
        item,
        score: maxScore,
        matchedFields,
      })
    }
  }
  
  // Sort by score (highest first)
  return results.sort((a, b) => b.score - a.score)
}


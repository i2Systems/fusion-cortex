/**
 * Recent Searches Storage
 * 
 * Manages recent search queries with localStorage persistence.
 * Provides smart suggestions based on search history.
 * 
 * AI Note: This enables typeahead and search history features.
 */

const RECENT_SEARCHES_KEY = 'fusion_recent_searches'
const MAX_RECENT_SEARCHES = 10

export interface RecentSearch {
  query: string
  timestamp: number
  pageType?: string
}

/**
 * Get recent searches from localStorage
 */
export function getRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (!stored) return []
    
    const searches: RecentSearch[] = JSON.parse(stored)
    // Sort by timestamp (most recent first)
    return searches.sort((a, b) => b.timestamp - a.timestamp)
  } catch (e) {
    console.warn('Failed to load recent searches:', e)
    return []
  }
}

/**
 * Add a search to recent searches
 */
export function addRecentSearch(query: string, pageType?: string): void {
  if (typeof window === 'undefined' || !query.trim()) return
  
  try {
    const searches = getRecentSearches()
    
    // Remove duplicate (if exists)
    const filtered = searches.filter(s => s.query.toLowerCase() !== query.toLowerCase())
    
    // Add new search at the beginning
    const newSearch: RecentSearch = {
      query: query.trim(),
      timestamp: Date.now(),
      pageType,
    }
    
    const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES)
    
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch (e) {
    console.warn('Failed to save recent search:', e)
  }
}

/**
 * Clear recent searches
 */
export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(RECENT_SEARCHES_KEY)
}

/**
 * Get suggestions based on current query
 */
export function getSearchSuggestions(
  query: string,
  maxSuggestions: number = 5
): RecentSearch[] {
  if (!query.trim()) {
    // Return most recent searches when query is empty
    return getRecentSearches().slice(0, maxSuggestions)
  }
  
  const lowerQuery = query.toLowerCase()
  const recent = getRecentSearches()
  
  // Filter and score recent searches that match
  const matches = recent
    .filter(search => {
      const lowerSearch = search.query.toLowerCase()
      return lowerSearch.includes(lowerQuery) || lowerQuery.includes(lowerSearch)
    })
    .slice(0, maxSuggestions)
  
  return matches
}


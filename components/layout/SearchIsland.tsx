/**
 * Search Island Component
 * 
 * Reusable floating search island with site selector.
 * Can be positioned at top or bottom, full width or centered.
 * 
 * AI Note: Use this component for consistent search islands across pages.
 */

'use client'

import { Search, Layers, Sparkles, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Activity, Clock, X, User, Users, AlertTriangle, ArrowRight } from 'lucide-react'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearch } from '@/lib/SearchContext'
import { useDevices } from '@/lib/hooks/useDevices'
import { usePeople } from '@/lib/hooks/usePeople'
import { useGroups } from '@/lib/hooks/useGroups'
import { useSite } from '@/lib/hooks/useSite'
import { trpc } from '@/lib/trpc/client'
import { fuzzySearch, type SearchResult } from '@/lib/fuzzySearch'
import { getRecentSearches, addRecentSearch, getSearchSuggestions, clearRecentSearches } from '@/lib/recentSearches'
import { usePathname, useRouter } from 'next/navigation'

interface Metric {
  label: string
  value: string | number
  color?: string
  trend?: 'up' | 'down' | 'stable'
  delta?: number
  description?: string
  icon?: React.ReactNode
  onClick?: () => void
}

interface SearchIslandProps {
  position?: 'top' | 'bottom'
  fullWidth?: boolean
  showActions?: boolean
  placeholder?: string
  title?: string
  subtitle?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  onLayersClick?: () => void
  filterCount?: number
  onActionDetected?: (action: { id: string; label: string }) => void
  metrics?: Metric[]
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="font-bold text-[var(--color-primary)]">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

export function SearchIsland({
  position = 'bottom',
  fullWidth = true,
  showActions = false,
  placeholder = 'Search, input a task, or ask a question...',
  title,
  subtitle,
  searchValue,
  onSearchChange,
  onLayersClick,
  filterCount = 0,
  onActionDetected,
  metrics = []
}: SearchIslandProps) {
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [focused, setFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const { detectAction, getPageActions, pageType } = useSearch()
  // Devices may not be available on all pages - handle gracefully
  const devicesContext = useDevices()
  const devices = devicesContext?.devices || []

  // Fetch other entities for cross-app search
  const { people } = usePeople()
  const { groups } = useGroups()
  const { activeSiteId } = useSite()
  const { data: faults } = trpc.fault.list.useQuery(
    { siteId: activeSiteId || '' },
    { enabled: !!activeSiteId, refetchOnWindowFocus: false }
  )

  const pathname = usePathname()
  const router = useRouter()

  // Use controlled value if provided, otherwise use internal state
  const searchQuery = searchValue !== undefined ? searchValue : internalSearchQuery
  const setSearchQuery = onSearchChange || setInternalSearchQuery

  // Detect actions from search query
  const detectedAction = useMemo(() => {
    if (!searchQuery.trim()) return null
    return detectAction(searchQuery)
  }, [searchQuery, detectAction])

  // Notify parent when action is detected
  useEffect(() => {
    if (detectedAction && onActionDetected) {
      onActionDetected(detectedAction)
    }
  }, [detectedAction, onActionDetected])

  // Get recent searches and fuzzy-matched items
  const suggestions = useMemo(() => {
    const query = searchQuery.trim()

    // Get recent searches
    const recentSearches = (!focused && !showSuggestions) ? [] : getSearchSuggestions(query, 3)

    if (!query || (!focused && !showSuggestions)) {
      return { recent: recentSearches, items: [] }
    }

    // Prepare standardized items for search
    const searchItems = [
      // Devices
      ...devices.map(d => ({
        type: 'device' as const,
        id: d.id,
        label: d.deviceId,
        subLabel: d.serialNumber !== d.deviceId ? d.serialNumber : undefined,
        description: [d.location, d.zone].filter(Boolean).join(' • '),
        keywords: [d.deviceId, d.serialNumber, d.location, d.zone, d.type].filter(Boolean).join(' '),
        original: d,
        score: 0, // Will be set by fuzzy search
        route: '/dashboard' // Simplified, assumes dashboard is main view
      })),
      // People
      ...people.map(p => ({
        type: 'person' as const,
        id: p.id,
        label: `${p.firstName} ${p.lastName}`,
        subLabel: p.role,
        description: p.email,
        keywords: [`${p.firstName} ${p.lastName}`, p.email, p.role].filter(Boolean).join(' '),
        original: p,
        score: 0,
        route: '/people'
      })),
      // Groups
      ...groups.map(g => ({
        type: 'group' as const,
        id: g.id,
        label: g.name,
        subLabel: `${g.deviceIds.length} devices • ${g.personIds.length} people`,
        description: g.description,
        keywords: [g.name, g.description].filter(Boolean).join(' '),
        original: g,
        score: 0,
        route: '/groups'
      })),
      // Faults
      ...(faults || []).map(f => ({
        type: 'fault' as const,
        id: f.id,
        label: `${f.faultType} on ${f.deviceId}`, // Need deviceId from fault. Note: trpc types might need checking. 
        // Assuming fault object has deviceId or we need to look it up. 
        // Checking fault list usage: it has deviceId directly on the fault object from the list query usually?
        // Let's assume standard fault shape for now or use description.
        // Actually, dbFaults in faults/page.tsx has deviceId.
        subLabel: 'Fault Detected',
        description: f.description,
        keywords: [f.faultType, f.description, (f as any).deviceId].filter(Boolean).join(' '),
        original: f,
        score: 0,
        route: '/faults' as const
      }))
    ]

    // Perform fuzzy search
    const results = fuzzySearch(
      query,
      searchItems,
      ['label', 'subLabel', 'description', 'keywords'],
      20
    ).map(r => ({ ...r.item, score: r.score }))

    // Context-aware scoring boost
    const boostedResults = results.map(item => {
      let boostedScore = item.score

      // Boost based on current page context
      if (pathname === '/people' && item.type === 'person') boostedScore += 20
      if (pathname === '/groups' && item.type === 'group') boostedScore += 20
      if (pathname === '/faults' && item.type === 'fault') boostedScore += 20
      if (pathname === '/dashboard' && item.type === 'device') boostedScore += 10

      return { ...item, score: boostedScore }
    }).sort((a, b) => b.score - a.score)

    return {
      recent: recentSearches,
      items: boostedResults.slice(0, 8), // Limit total results
    }
  }, [searchQuery, devices, people, groups, faults, focused, showSuggestions, pathname])

  // Show suggestions when focused or typing
  useEffect(() => {
    setShowSuggestions(focused || searchQuery.length > 0)
  }, [focused, searchQuery])

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    setFocused(false)
    addRecentSearch(suggestion, pageType)
    searchInputRef.current?.blur()
  }, [setSearchQuery, pageType])

  // Handle item selection (navigation)
  const handleItemSelect = useCallback((item: any) => {
    setSearchQuery('')
    setShowSuggestions(false)
    setFocused(false)
    searchInputRef.current?.blur()

    // Add to recent searches with type prefix to distinguish
    addRecentSearch(item.label, pageType) // Or use item.type

    // Navigate based on type
    if (item.type === 'person') {
      router.push(`/people?id=${item.id}`)
    } else if (item.type === 'group') {
      router.push(`/groups?id=${item.id}`)
    } else if (item.type === 'fault') {
      router.push(`/faults?id=${item.id}`)
    } else if (item.type === 'device') {
      // For devices, we might want to select it on dashboard or go to details
      // If we are on dashboard, just select. Else go to dashboard.
      if (pathname === '/dashboard' || pathname === '/') {
        // Emit event or use context to select device?
        // For now, simpler to push with query param that dashboard handles
        router.push(`/dashboard?select=${item.id}`)
      } else {
        router.push(`/dashboard?select=${item.id}`)
      }
    }
  }, [router, pathname, pageType, setSearchQuery])

  // Handle Enter key - save search and execute
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (selectedSuggestionIndex >= 0) {
        // Select highlighted suggestion
        const recentCount = suggestions.recent.length

        if (selectedSuggestionIndex < recentCount) {
          // It's a recent search
          handleSuggestionSelect(suggestions.recent[selectedSuggestionIndex].query)
        } else {
          // It's a search result item
          const itemIndex = selectedSuggestionIndex - recentCount
          if (suggestions.items[itemIndex]) {
            handleItemSelect(suggestions.items[itemIndex])
          }
        }
      } else if (searchQuery.trim()) {
        // Save search and execute action if detected
        addRecentSearch(searchQuery, pageType)
        if (detectedAction) {
          detectedAction.action()
          setSearchQuery('')
        }
      }
      setShowSuggestions(false)
      setFocused(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const totalSuggestions = suggestions.recent.length + suggestions.items.length
      setSelectedSuggestionIndex(prev =>
        prev < totalSuggestions - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setFocused(false)
      searchInputRef.current?.blur()
    }
  }, [selectedSuggestionIndex, suggestions, searchQuery, detectedAction, handleSuggestionSelect, handleItemSelect, setSearchQuery, pageType])

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
        setFocused(false)
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSuggestions])

  // Auto-scroll to selected item
  useEffect(() => {
    if (selectedSuggestionIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.querySelector(`button[data-index="${selectedSuggestionIndex}"]`)
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedSuggestionIndex])

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const containerClass = position === 'top'
    ? fullWidth
      ? 'w-full px-4 md:pl-5'
      : 'max-w-3xl mx-auto px-4'
    : fullWidth
      ? 'w-full px-4'
      : 'max-w-4xl mx-auto px-4'

  // Position class - pages handle fixed positioning via wrappers
  const positionClass = position === 'top'
    ? ''
    : ''

  return (
    <div className={`${containerClass} ${positionClass}`} style={{ position: 'relative', zIndex: showSuggestions ? 9999 : 'auto' }}>
      <div className="fusion-card backdrop-blur-xl border border-[var(--color-primary)]/20 search-island py-3 md:py-4 px-3 md:px-5">
        {/* Layout: Title + Metrics (stacked on mobile) + Search + Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 lg:gap-4">
          {/* Title Section */}
          {title && (
            <div className="flex-shrink-0 min-w-0 w-full md:w-auto">
              <h1 className="text-base md:text-lg font-bold text-[var(--color-text)] leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-[var(--color-text-muted)] leading-tight mt-0.5 line-clamp-1 hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Metrics - Grid layout on mobile, horizontal on desktop with progressive sizing */}
          {metrics.length > 0 && (
            <div className="w-full md:w-auto md:flex-shrink md:min-w-0">
              <div className="grid grid-cols-3 sm:grid-cols-3 md:flex md:flex-row gap-1.5 sm:gap-2 md:gap-2 lg:gap-3 md:flex-shrink-0 md:overflow-x-auto md:scrollbar-hide md:-mx-1 md:px-1">
                {metrics.map((metric, index) => (
                  <div
                    key={index}
                    onClick={metric.onClick}
                    className={`flex items-center gap-1 sm:gap-1.5 md:gap-1.5 lg:gap-2 px-2 sm:px-2.5 md:px-2 lg:px-3 py-1.5 sm:py-2 md:py-1.5 lg:py-2 rounded-md sm:rounded-lg bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] ${metric.onClick ? 'cursor-pointer hover:bg-[var(--color-surface)] hover:border-[var(--color-primary)]/30 transition-all duration-200' : ''
                      }`}
                  >
                    {metric.icon && (
                      <div className="flex-shrink-0 hidden sm:block md:w-3 md:h-3 lg:w-4 lg:h-4">
                        {metric.icon}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="text-[10px] sm:text-xs md:text-[10px] lg:text-xs text-[var(--color-text-muted)] leading-tight truncate">
                        {metric.label}
                      </div>
                      <div className="flex items-baseline gap-0.5 sm:gap-1 md:gap-0.5 lg:gap-1.5">
                        <span
                          className="text-sm sm:text-base md:text-sm lg:text-base xl:text-lg font-bold leading-tight truncate"
                          style={{ color: metric.color || 'var(--color-text)' }}
                        >
                          {metric.value}
                        </span>
                        {metric.trend && metric.delta !== undefined && metric.delta !== 0 && (
                          <div className={`flex items-center gap-0.5 text-[9px] sm:text-[10px] md:text-[9px] lg:text-xs font-semibold flex-shrink-0 ${metric.trend === 'up'
                            ? 'text-[var(--color-success)]'
                            : metric.trend === 'down'
                              ? 'text-[var(--color-danger)]'
                              : 'text-[var(--color-text-muted)]'
                            }`}>
                            {metric.trend === 'up' ? (
                              <ArrowUp size={8} className="md:w-2.5 md:h-2.5 lg:w-3 lg:h-3" />
                            ) : metric.trend === 'down' ? (
                              <ArrowDown size={8} className="md:w-2.5 md:h-2.5 lg:w-3 lg:h-3" />
                            ) : null}
                            {Math.abs(metric.delta)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spacer to push search to the right - smaller on larger screens to give more space to search */}
          <div className="flex-1 hidden md:block min-w-0 lg:flex-[0.5] xl:flex-[0.3]" />

          {/* Search - Shrinks when space is constrained, min-width 120px, grows on larger screens */}
          <div className="relative min-w-0 w-full md:w-auto md:flex-shrink md:min-w-[120px] md:flex-[2] lg:flex-[3] xl:flex-[4] xl:max-w-none 2xl:max-w-none" style={{ zIndex: 'var(--z-dropdown)' }}>
            <div className="w-full min-w-0 relative">
              <Search
                size={16}
                className="absolute left-2.5 md:left-3 lg:left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] flex-shrink-0 z-10"
              />
              {detectedAction && (
                <div className="absolute right-2 md:right-3 lg:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 md:gap-1.5 lg:gap-2 z-10">
                  <Sparkles size={10} className="text-[var(--color-primary)] animate-pulse hidden sm:block md:w-3 md:h-3" />
                  <span className="text-[9px] md:text-[10px] lg:text-xs text-[var(--color-primary)] font-medium bg-[var(--color-primary-soft)] px-1 md:px-1.5 lg:px-2 py-0.5 rounded">
                    {detectedAction.label}
                  </span>
                </div>
              )}
              {/* Keyboard Shortcut Hint */}
              {!searchQuery && !focused && (
                <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-0.5 text-[var(--color-text-muted)] opacity-60 border border-[var(--color-border-subtle)] rounded px-1.5 py-0.5 bg-[var(--color-surface-subtle)]">
                  <span className="text-[10px] md:text-xs font-medium">⌘</span>
                  <span className="text-[10px] md:text-xs font-medium">K</span>
                </div>
              )}
              <input
                ref={searchInputRef}
                type="text"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedSuggestionIndex(-1)
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  setFocused(true)
                  setShowSuggestions(true)
                }}
                onBlur={() => {
                  // Delay to allow click on suggestions
                  setTimeout(() => setFocused(false), 200)
                }}
                className={`w-full pl-9 md:pl-10 lg:pl-12 pr-2 md:pr-3 lg:pr-4 py-2 md:py-2.5 lg:py-3 h-[40px] md:h-[44px] lg:h-[52px] bg-[var(--color-bg-elevated)] border-2 rounded-xl text-xs md:text-sm lg:text-base xl:text-lg font-medium text-[var(--color-text)] placeholder:text-[var(--color-text-soft)] placeholder:font-normal focus:outline-none focus:shadow-[var(--shadow-glow-primary)] transition-all ${detectedAction
                  ? 'border-[var(--color-primary)] pr-20 md:pr-24 lg:pr-32 focus:ring-2 focus:ring-[var(--color-primary)]'
                  : 'border-[var(--color-border-subtle)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]'
                  }`}
              />

              {/* Typeahead Suggestions Dropdown */}
              {showSuggestions && (suggestions.recent.length > 0 || suggestions.items.length > 0) && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-2 rounded-xl max-h-96 overflow-auto border border-[var(--color-primary)]/30 shadow-[var(--shadow-strong)]"
                  style={{
                    zIndex: 9999,
                    background: 'var(--color-tooltip-bg)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                    boxShadow: 'var(--shadow-strong), 0 0 0 1px var(--color-border-subtle), inset 0 1px 0 var(--acrylic-tint)',
                  }}
                >
                  {/* Recent Searches */}
                  {suggestions.recent.length > 0 && (
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-2 px-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
                          <Clock size={12} />
                          <span>Recent</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            clearRecentSearches()
                          }}
                          className="text-xs text-[var(--color-text-soft)] hover:text-[var(--color-text)] transition-colors"
                          title="Clear history"
                        >
                          Clear
                        </button>
                      </div>
                      {suggestions.recent.map((recent, idx) => {
                        const isSelected = selectedSuggestionIndex === idx
                        return (
                          <button
                            key={`recent-${idx}`}
                            data-index={idx}
                            onClick={() => handleSuggestionSelect(recent.query)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${isSelected
                              ? 'bg-[var(--color-primary-soft)] text-[var(--color-text)]'
                              : 'hover:bg-[var(--color-surface-subtle)] text-[var(--color-text)]'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-[var(--color-text-muted)] flex-shrink-0" />
                              <span className="truncate">
                                <HighlightedText text={recent.query} query={searchQuery} />
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Mixed Results */}
                  {suggestions.items.length > 0 && (
                    <div className="p-2 border-t border-[var(--color-border-subtle)]">
                      <div className="px-2 mb-2 text-xs font-semibold text-[var(--color-text-muted)] flex justify-between">
                        <span>Best Matches</span>
                        <span className="text-[10px] font-normal opacity-70">Cross-app search</span>
                      </div>
                      {suggestions.items.map((item, idx) => {
                        const suggestionIdx = suggestions.recent.length + idx
                        const isSelected = selectedSuggestionIndex === suggestionIdx

                        let Icon = Search
                        let iconColor = 'text-[var(--color-primary)]'

                        switch (item.type) {
                          case 'person':
                            Icon = User
                            iconColor = 'text-[var(--color-info)]'
                            break
                          case 'group':
                            Icon = Users
                            iconColor = 'text-[var(--color-success)]'
                            break
                          case 'fault':
                            Icon = AlertTriangle
                            iconColor = 'text-[var(--color-danger)]'
                            break
                          case 'device':
                            Icon = Search
                            iconColor = 'text-[var(--color-primary)]'
                            break
                        }

                        return (
                          <button
                            key={`${item.type}-${item.id}`}
                            data-index={suggestionIdx}
                            onClick={() => handleItemSelect(item)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${isSelected
                              ? 'bg-[var(--color-primary-soft)] text-[var(--color-text)]'
                              : 'hover:bg-[var(--color-surface-subtle)] text-[var(--color-text)]'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center ${iconColor.replace('text-', 'bg-').replace(']', ']/10')}`}>
                                <Icon size={14} className={iconColor} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate flex items-center gap-2">
                                  <HighlightedText text={item.label || ''} query={searchQuery} />
                                  {item.type !== 'device' && (
                                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] font-medium border border-[var(--color-border-subtle)]">
                                      {item.type}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-[var(--color-text-muted)] truncate flex items-center gap-1.5">
                                  {item.subLabel && <HighlightedText text={item.subLabel || ''} query={searchQuery} />}
                                  {item.subLabel && item.description && <span className="opacity-50">•</span>}
                                  {item.description && <span className="opacity-75">
                                    <HighlightedText text={item.description || ''} query={searchQuery} />
                                  </span>}
                                </div>
                              </div>
                              {isSelected && <ArrowRight size={14} className="text-[var(--color-primary)] opacity-50" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex-shrink-0">
              <button
                onClick={onLayersClick}
                className="px-3 md:px-4 py-1.5 md:py-2 bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-lg text-xs md:text-sm text-[var(--color-text)] hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-glow-primary)] transition-all flex items-center gap-1.5 md:gap-2 relative h-[36px] md:h-[38px]"
              >
                <Layers size={14} />
                <span className="text-xs md:text-sm hidden sm:inline">Layers</span>
                {filterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-primary)] text-[var(--color-text)] text-[10px] md:text-xs flex items-center justify-center font-semibold">
                    {filterCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


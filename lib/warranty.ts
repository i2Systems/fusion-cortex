/**
 * Warranty Utility Functions
 * 
 * Functions for calculating warranty status and determining if warranty is
 * active, expired, or near expiration.
 * 
 * AI Note: Used across the app to display warranty information consistently.
 */

export type WarrantyStatus = 'in-warranty' | 'out-of-warranty' | 'near-end'

export interface WarrantyInfo {
  status: WarrantyStatus
  expiryDate: Date | null
  daysRemaining: number | null
  isExpired: boolean
  isNearEnd: boolean
}

/**
 * Calculate warranty status based on expiry date
 * @param warrantyExpiry - Warranty expiration date (null if no warranty)
 * @param nearEndDays - Number of days before expiry to consider "near end" (default: 30)
 * @returns WarrantyInfo object with status and details
 */
export function calculateWarrantyStatus(
  warrantyExpiry: Date | null | undefined,
  nearEndDays: number = 30
): WarrantyInfo {
  if (!warrantyExpiry) {
    return {
      status: 'out-of-warranty',
      expiryDate: null,
      daysRemaining: null,
      isExpired: true,
      isNearEnd: false,
    }
  }

  const now = new Date()
  const expiry = new Date(warrantyExpiry)
  const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  const isExpired = daysRemaining < 0
  const isNearEnd = !isExpired && daysRemaining <= nearEndDays

  let status: WarrantyStatus
  if (isExpired) {
    status = 'out-of-warranty'
  } else if (isNearEnd) {
    status = 'near-end'
  } else {
    status = 'in-warranty'
  }

  return {
    status,
    expiryDate: expiry,
    daysRemaining: isExpired ? null : daysRemaining,
    isExpired,
    isNearEnd,
  }
}

/**
 * Get display label for warranty status
 */
export function getWarrantyStatusLabel(status: WarrantyStatus): string {
  switch (status) {
    case 'in-warranty':
      return 'In Warranty'
    case 'out-of-warranty':
      return 'Out of Warranty'
    case 'near-end':
      return 'Near End'
    default:
      return 'Unknown'
  }
}

/**
 * Get color class for warranty status badge
 */
export function getWarrantyStatusColor(status: WarrantyStatus): string {
  switch (status) {
    case 'in-warranty':
      return 'text-[var(--color-success)]'
    case 'out-of-warranty':
      return 'text-[var(--color-danger)]'
    case 'near-end':
      return 'text-[var(--color-warning)]'
    default:
      return 'text-[var(--color-text-muted)]'
  }
}

/**
 * Get token class for warranty status badge (uses token system)
 */
export function getWarrantyStatusTokenClass(status: WarrantyStatus): string {
  switch (status) {
    case 'in-warranty':
      return 'token token-warranty-in-warranty'
    case 'out-of-warranty':
      return 'token token-warranty-out-of-warranty'
    case 'near-end':
      return 'token token-warranty-near-end'
    default:
      return 'token token-status-offline'
  }
}

/**
 * Get background color class for warranty status badge (legacy - use getWarrantyStatusTokenClass instead)
 * @deprecated Use getWarrantyStatusTokenClass for better theme support
 */
export function getWarrantyStatusBgColor(status: WarrantyStatus): string {
  return getWarrantyStatusTokenClass(status)
}

/**
 * Format warranty expiry date for display
 */
export function formatWarrantyExpiry(expiryDate: Date | null | undefined): string {
  if (!expiryDate) return 'No warranty'
  
  const date = new Date(expiryDate)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}


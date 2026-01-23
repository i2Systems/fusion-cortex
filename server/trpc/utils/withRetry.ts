/**
 * Retry Utility for tRPC Routers
 * 
 * Handles transient database errors like prepared statement conflicts
 * that can occur with connection pooling (especially with Supabase/PgBouncer).
 * 
 * Usage:
 *   return await withRetry(() => prisma.device.findMany({...}))
 *   
 *   // With fallback value on error:
 *   return await withRetry(() => prisma.device.findMany({...}), { fallback: [] })
 */

import { logger } from '@/lib/logger'

export interface WithRetryOptions<T> {
    /** Maximum number of retry attempts (default: 3) */
    maxRetries?: number
    /** Delay between retries in ms (default: 200) */
    delayMs?: number
    /** Context for logging (e.g., 'device.list') */
    context?: string
    /** Fallback value to return on final failure instead of throwing */
    fallback?: T
    /** Use exponential backoff (delay * attempt) */
    exponentialBackoff?: boolean
}

/**
 * Check if an error is a prepared statement conflict
 * These occur with PgBouncer/Supabase connection pooling
 */
export function isPreparedStatementError(error: any): boolean {
    if (!error) return false

    return (
        error.code === '26000' ||  // PostgreSQL prepared statement error
        error.code === '42P05' ||  // Duplicate prepared statement
        error.message?.includes('prepared statement')
    )
}

/**
 * Check if an error is a record not found error
 */
export function isNotFoundError(error: any): boolean {
    if (!error) return false

    return (
        error.code === 'P2025' ||
        error.message?.includes('Record to update not found') ||
        error.message?.includes('Record to delete does not exist') ||
        error.message?.includes('not found')
    )
}

/**
 * Check if an error is a unique constraint violation
 */
export function isUniqueConstraintError(error: any): boolean {
    if (!error) return false

    return error.code === 'P2002'
}

/**
 * Check if an error is a database connection error
 */
export function isConnectionError(error: any): boolean {
    if (!error) return false

    return (
        error.code === 'P1001' ||
        error.code === 'P1000' ||
        error.code === 'P1010' ||
        error.message?.includes('Can\'t reach database') ||
        error.message?.includes('Authentication failed') ||
        error.message?.includes('denied access')
    )
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Execute an async operation with automatic retry on transient errors.
 * 
 * @param operation - The async function to execute
 * @param options - Retry configuration
 * @returns The result of the operation
 * @throws The last error if all retries fail and no fallback is provided
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    options: WithRetryOptions<T> = {}
): Promise<T> {
    const {
        maxRetries = 3,
        delayMs = 200,
        context = 'operation',
        fallback,
        exponentialBackoff = false,
    } = options

    let lastError: any = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await operation()
        } catch (error: any) {
            lastError = error

            // Only retry on transient errors (prepared statement conflicts)
            const isRetryable = isPreparedStatementError(error)

            if (isRetryable && attempt < maxRetries - 1) {
                const delay = exponentialBackoff ? delayMs * (attempt + 1) : delayMs
                logger.debug(`Retrying ${context} after error (attempt ${attempt + 1}/${maxRetries})...`)
                await sleep(delay)
                continue
            }

            // Not retryable or out of retries
            break
        }
    }

    // All retries exhausted
    if (fallback !== undefined) {
        logger.warn(`${context} failed after ${maxRetries} attempts, returning fallback value`)
        return fallback
    }

    // No fallback - throw the error
    throw lastError
}

/**
 * Wrapper specifically for list operations that should return empty array on failure
 */
export async function withRetryList<T>(
    operation: () => Promise<T[]>,
    context: string
): Promise<T[]> {
    return withRetry(operation, { context, fallback: [] as T[] })
}

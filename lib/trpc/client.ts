/**
 * tRPC Client Setup
 * 
 * Frontend tRPC client configuration for Next.js App Router.
 * 
 * AI Note: Use this client in React components to make type-safe API calls.
 * Example:
 *   const { data } = trpc.device.search.useQuery({ query: '765' })
 */

import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/server/trpc/routers/_app'

export const trpc = createTRPCReact<AppRouter>()


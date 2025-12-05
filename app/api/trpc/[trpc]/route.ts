/**
 * tRPC API Route Handler
 * 
 * Next.js App Router handler for tRPC requests.
 * 
 * AI Note: This is the entry point for all tRPC API calls.
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/server/trpc/routers/_app'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({}),
  })

export { handler as GET, handler as POST }


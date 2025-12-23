/**
 * tRPC Provider Component
 * 
 * Wraps the app with tRPC and React Query providers.
 * 
 * AI Note: Add this to your root layout to enable tRPC throughout the app.
 */

'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink, httpLink, splitLink } from '@trpc/client'
import superjson from 'superjson'
import { trpc } from './client'

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        // Split link: use non-batched link for site.ensureExists, batched for everything else
        splitLink({
          condition: (op) => {
            // Use non-batched link for site.ensureExists mutations
            // Check both the path and type to be sure
            const isEnsureExists = op.type === 'mutation' && 
              (op.path === 'site.ensureExists' || 
               (typeof op.path === 'string' && op.path.includes('site.ensureExists')))
            
            // Log for debugging in production
            if (isEnsureExists && typeof window !== 'undefined') {
              console.log('[tRPC] Routing site.ensureExists to non-batched link', {
                type: op.type,
                path: op.path,
                id: op.id,
              })
            }
            
            return isEnsureExists
          },
          // Non-batched link for ensureExists
          true: httpLink({
            url: `${getBaseUrl()}/api/trpc`,
            transformer: superjson,
          }),
          // Batched link for everything else
          false: httpBatchLink({
            url: `${getBaseUrl()}/api/trpc`,
            transformer: superjson,
            // Increase maxBatchSize to prevent accidental batching
            maxBatchSize: 1, // Actually, let's disable batching entirely for now
          }),
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}


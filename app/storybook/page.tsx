/**
 * Storybook Page
 * 
 * Redirects to the Storybook development server.
 * In production, this could serve a built Storybook static site.
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/lib/ToastContext'

export default function StorybookPage() {
  const router = useRouter()
  const { addToast } = useToast()

  useEffect(() => {
    // In development, redirect to Storybook dev server
    if (process.env.NODE_ENV === 'development') {
      window.location.href = 'http://localhost:6006'
    } else {
      // In production, you could serve a built Storybook here
      // For now, show a message
      addToast({
        type: 'info',
        title: 'Development Only',
        message: 'Storybook is only available in development mode. Run `npm run storybook` to start it.'
      })
      router.push('/dashboard')
    }
  }, [router, addToast])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      padding: 'var(--space-6)',
    }}>
      <div className="fusion-card" style={{ maxWidth: '500px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text)' }}>
          Opening Storybook...
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
          If Storybook doesn't open automatically, make sure it's running:
        </p>
        <code style={{
          display: 'block',
          padding: 'var(--space-3)',
          backgroundColor: 'var(--color-bg-elevated)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-primary)',
          marginBottom: 'var(--space-4)',
        }}>
          npm run storybook
        </code>
        <Button
          onClick={() => window.open('http://localhost:6006', '_blank')}
          variant="primary"
        >
          Open Storybook
        </Button>
      </div>
    </div>
  )
}

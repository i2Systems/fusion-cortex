/**
 * Login/Signup Modal
 * 
 * Modal for user authentication (fake, for demo).
 * Toggles between login and signup views.
 * 
 * AI Note: This is a placeholder. Replace with real auth when ready.
 */

'use client'

import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  const titleId = `login-modal-title-${Math.random().toString(36).substr(2, 9)}`

  const { login, signup } = useAuth()

  // Focus trap
  useFocusTrap({
    isOpen,
    onClose,
    containerRef: modalRef,
    enabled: isOpen,
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      let success = false
      if (isSignup) {
        success = await signup(name, email, password)
      } else {
        success = await login(email, password)
      }

      if (success) {
        onClose()
        setName('')
        setEmail('')
        setPassword('')
        setIsSignup(false)
      } else {
        setError('Authentication failed. Please try again.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[var(--z-modal)]"
      onClick={onClose}
      style={{ backgroundColor: 'var(--color-backdrop)' }}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-[var(--color-surface)] backdrop-blur-xl rounded-[var(--radius-2xl)] shadow-[var(--shadow-strong)] w-full max-w-md p-8 border border-[var(--color-primary)]/30"
        style={{ boxShadow: 'var(--glow-modal)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 id={titleId} className="text-2xl font-bold text-[var(--color-text)]">
            {isSignup ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-subtle)] transition-colors text-[var(--color-text-muted)]"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label htmlFor="login-name" className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                Name
              </label>
              <Input
                id="login-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              Email
            </label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              Password
            </label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-[var(--color-danger)]/20 border border-[var(--color-danger)]/30 rounded-lg text-sm text-[var(--color-danger)]">
              {error}
            </div>
          )}

          <Button
            type="submit"
            isLoading={isLoading}
            variant="primary"
            className="w-full mt-6"
          >
            {isSignup ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignup(!isSignup)
              setError('')
            }}
            className="text-sm text-[var(--color-primary)] hover:underline"
            aria-label={isSignup ? 'Switch to sign in' : 'Switch to sign up'}
          >
            {isSignup
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}


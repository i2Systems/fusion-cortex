/**
 * Fake Auth Context
 * 
 * Simple client-side auth state management for demo purposes.
 * In production, this would integrate with Auth.js/NextAuth.
 * 
 * AI Note: This is a placeholder auth system. Replace with real auth when ready.
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('fusion_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch (e) {
        // Invalid data, clear it
        localStorage.removeItem('fusion_user')
      }
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Fake login - accept any email/password
    // In production, this would call your auth API
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
    
    const newUser: User = {
      id: '1',
      name: email.split('@')[0] || 'User',
      email,
      role: 'commissioning',
    }
    
    setUser(newUser)
    localStorage.setItem('fusion_user', JSON.stringify(newUser))
    return true
  }

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    // Fake signup
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role: 'commissioning',
    }
    
    setUser(newUser)
    localStorage.setItem('fusion_user', JSON.stringify(newUser))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('fusion_user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


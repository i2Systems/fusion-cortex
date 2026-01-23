/**
 * Auth Context
 * 
 * Client-side auth state management for demo purposes.
 * Also includes role management (merged from RoleProvider).
 * In production, this would integrate with Auth.js/NextAuth.
 * 
 * AI Note: This is a placeholder auth system. Replace with real auth when ready.
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type UserRole = 'Admin' | 'Manager' | 'Technician'

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
  // Role management (merged from RoleProvider)
  role: UserRole
  setRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRoleState] = useState<UserRole>('Admin')
  const [mounted, setMounted] = useState(false)

  // Load user and role from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('fusion_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem('fusion_user')
      }
    }

    const storedRole = localStorage.getItem('fusion_role') as UserRole | null
    if (storedRole && ['Admin', 'Manager', 'Technician'].includes(storedRole)) {
      setRoleState(storedRole)
    }
    setMounted(true)
  }, [])

  // Save role to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('fusion_role', role)
    }
  }, [role, mounted])

  const login = async (email: string, password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500))

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

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        role,
        setRole,
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

/**
 * @deprecated Use useAuth() instead. This is for backward compatibility with RoleProvider.
 */
export function useRole() {
  const { role, setRole } = useAuth()
  return { role, setRole }
}

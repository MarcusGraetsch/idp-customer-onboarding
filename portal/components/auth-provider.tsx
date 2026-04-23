'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => void
  logout: () => void
}

interface User {
  id: string
  email: string
  name: string
  roles: string[]
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Prüfe ob Token im localStorage
    const token = localStorage.getItem('idp_token')
    if (token) {
      try {
        // JWT Token decodieren (Base64 Payload)
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({
          id: payload.sub || 'unknown',
          email: payload.email || 'unknown@example.com',
          name: payload.name || payload.preferred_username || 'User',
          roles: payload.realm_access?.roles || [],
        })
      } catch {
        localStorage.removeItem('idp_token')
      }
    }
    setIsLoading(false)
  }, [])

  const login = () => {
    // Für MVP: Redirect zu Keycloak oder zeige Login-Form
    // In Produktion: Keycloak OAuth2 Flow
    window.location.href = '/login'
  }

  const logout = () => {
    localStorage.removeItem('idp_token')
    setUser(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getAccessToken, getUserInfo, parseToken, logout as keycloakLogout, getLoginUrl } from '@/lib/keycloak'

interface User {
  id: string
  email: string
  name: string
  roles: string[]
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => void
  logout: () => void
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  getToken: async () => null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // User aus Token laden
  const loadUser = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    // Aus Token parsen
    const parsed = parseToken(token)
    if (parsed) {
      setUser({
        id: parsed.sub,
        email: parsed.email,
        name: parsed.name,
        roles: parsed.roles,
      })
    } else {
      // Fallback: Userinfo Endpoint
      try {
        const info = await getUserInfo()
        if (info) {
          setUser({
            id: info.sub,
            email: info.email,
            name: info.name || info.preferred_username,
            roles: info.realm_access?.roles || [],
          })
        }
      } catch {
        setUser(null)
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadUser()

    // Prüfe ob wir von Keycloak Redirect zurückkommen
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    
    if (code) {
      // Code gegen Token austauschen
      handleCallback(code, state)
    }
  }, [loadUser])

  const handleCallback = async (code: string, _state: string | null) => {
    try {
      const redirectUri = window.location.origin + window.location.pathname
      await import('@/lib/keycloak').then(({ exchangeCode }) => exchangeCode(code, redirectUri))
      
      // URL sauber machen
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // User neu laden
      await loadUser()
    } catch (err) {
      console.error('Login Callback fehlgeschlagen:', err)
    }
  }

  const login = () => {
    const redirectUri = window.location.origin + '/login'
    window.location.href = getLoginUrl(redirectUri)
  }

  const logout = () => {
    keycloakLogout()
    setUser(null)
    window.location.href = '/'
  }

  const getToken = async () => {
    return await getAccessToken()
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      getToken,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Navigation } from '@/components/navigation'
import Link from 'next/link'
import { LogIn, Shield, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()

  // Wenn bereits eingeloggt → Dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = '/dashboard'
    }
  }, [isLoading, isAuthenticated])

  const handleKeycloakLogin = () => {
    login()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Anmelden
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Oder{' '}
            <Link href="/" className="font-medium text-primary-600 hover:text-primary-500">
              zur Startseite
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <button
              type="button"
              onClick={handleKeycloakLogin}
              className="flex w-full justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <LogIn className="h-4 w-4 mr-2 mt-0.5" />
              Mit Keycloak anmelden
            </button>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">
                    Für Entwicklung
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>SSO Login via Keycloak</p>
                <p className="mt-1">Demo Account: demo / demo123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { LayoutDashboard, Users, PlusCircle, LogOut, LogIn, User, Shield } from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout, login } = useAuth()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tenants', label: 'Tenants', icon: Users },
    { href: '/new-project', label: 'Neues Projekt', icon: PlusCircle },
    { href: '/profile', label: 'Profil', icon: User },
    { href: '/admin', label: 'Admin', icon: Shield },
  ]

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary-700">
              IDP Platform
            </Link>
            {isAuthenticated && (
              <div className="hidden md:ml-10 md:flex md:space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile"
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <span className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                    <span className="text-xs font-medium text-primary-700">
                      {(user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </span>
                  <span className="hidden md:inline">{user?.email}</span>
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

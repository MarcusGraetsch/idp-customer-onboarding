'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Navigation } from '@/components/navigation'
import Link from 'next/link'
import { Users, PlusCircle, Shield, Activity } from 'lucide-react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  const { data: tenants, error } = useSWR('/api/v1/tenants', fetcher)

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Laden...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Übersicht über Ihre Platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Tenants"
            value={tenants?.length || 0}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Apps"
            value={0}
            icon={Activity}
            color="green"
          />
          <StatCard
            title="Sicherheits-Scans"
            value={0}
            icon={Shield}
            color="yellow"
          />
          <StatCard
            title="Neu"
            value="—"
            icon={PlusCircle}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Schnellaktionen</h2>
          </div>
          <div className="px-6 py-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <QuickActionCard
              title="Neuen Tenant erstellen"
              description="Erstellen Sie einen neuen Kunden/Projekt"
              href="/new-project"
              icon={PlusCircle}
            />
            <QuickActionCard
              title="Tenants verwalten"
              description="Alle Tenants anzeigen und verwalten"
              href="/tenants"
              icon={Users}
            />
            <QuickActionCard
              title="Sicherheit"
              description="CVE Scans und Compliance prüfen"
              href="#"
              icon={Shield}
              disabled
            />
          </div>
        </div>

        {/* Recent Tenants */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Aktuelle Tenants</h2>
            <Link
              href="/tenants"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Alle anzeigen
            </Link>
          </div>
          
          {error ? (
            <div className="px-6 py-4 text-red-600">
              Fehler beim Laden: {error.message}
            </div>
          ) : !tenants ? (
            <div className="px-6 py-4 text-gray-500">Laden...</div>
          ) : tenants.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Tenants</h3>
              <p className="mt-1 text-sm text-gray-500">
                Erstellen Sie Ihren ersten Tenant
              </p>
              <div className="mt-6">
                <Link
                  href="/new-project"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Tenant erstellen
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {tenants.slice(0, 5).map((tenant: any) => (
                <li key={tenant.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tenant.display_name || tenant.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Namespace: {tenant.namespace}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tenant.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {tenant.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number | string, icon: any, color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    purple: 'bg-purple-50 text-purple-700',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
      <div className="flex items-center">
        <div className={`flex-shrink-0 rounded-md p-3 ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-2xl font-semibold text-gray-900">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
  )
}

function QuickActionCard({ title, description, href, icon: Icon, disabled }: { title: string, description: string, href: string, icon: any, disabled?: boolean }) {
  const content = (
    <div className={`relative group bg-gray-50 rounded-lg p-6 border-2 ${disabled ? 'border-gray-200 opacity-60 cursor-not-allowed' : 'border-gray-200 hover:border-primary-500 cursor-pointer'}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className="h-6 w-6 text-primary-600" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  )

  if (disabled) {
    return content
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  )
}

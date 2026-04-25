'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Navigation } from '@/components/navigation'
import Link from 'next/link'
import { Users, Shield, Server, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react'
import useSWR from 'swr'
import { authFetcher } from '@/lib/api-client'

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Check if user has admin role
  const isAdmin = user?.roles?.includes('tenant_admin') || user?.roles?.includes('platform_admin')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  const { data: tenants, error } = useSWR('/api/v1/tenants', authFetcher)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Stats
  const totalTenants = tenants?.length || 0
  const activeTenants = tenants?.filter((t: any) => t.status === 'active').length || 0
  const inactiveTenants = totalTenants - activeTenants

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
          <p className="mt-1 text-sm text-gray-500">
            Plattform-Übersicht und Verwaltung
          </p>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Gesamt Tenants"
            value={totalTenants}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Aktiv"
            value={activeTenants}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Inaktiv"
            value={inactiveTenants}
            icon={AlertTriangle}
            color="yellow"
          />
          <StatCard
            title="Plattform Status"
            value="OK"
            icon={Server}
            color="green"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Admin-Aktionen</h2>
          </div>
          <div className="px-6 py-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <AdminActionCard
              title="Neuen Tenant erstellen"
              description="Plattform-weit neuen Tenant anlegen"
              href="/new-project"
              icon={Users}
            />
            <AdminActionCard
              title="Alle Tenants"
              description="Alle Plattform-Tenants anzeigen"
              href="/tenants"
              icon={Server}
            />
            <AdminActionCard
              title="Sicherheit"
              description="CVE Scans und Compliance"
              href="#"
              icon={Shield}
              disabled
            />
          </div>
        </div>

        {/* All Tenants Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Alle Tenants</h2>
            <span className="text-sm text-gray-500">{totalTenants} insgesamt</span>
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
                Es wurden noch keine Tenants erstellt.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Namespace
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Erstellt
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tenants.map((tenant: any) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {tenant.display_name || tenant.name}
                        </div>
                        <div className="text-sm text-gray-500">{tenant.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {tenant.namespace}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tenant.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : tenant.status === 'inactive'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {tenant.tier || 'standard'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tenant.created_at).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/tenants/${tenant.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    red: 'bg-red-50 text-red-700',
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

function AdminActionCard({ title, description, href, icon: Icon, disabled }: { title: string, description: string, href: string, icon: any, disabled?: boolean }) {
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

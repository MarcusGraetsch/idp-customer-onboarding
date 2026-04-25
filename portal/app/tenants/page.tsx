'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Navigation } from '@/components/navigation'
import Link from 'next/link'
import { Users, PlusCircle, Trash2, ArrowRight } from 'lucide-react'
import useSWR, { mutate } from 'swr'
import { apiClient, authFetcher } from '@/lib/api-client'

export default function TenantsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  const { data: tenants, error } = useSWR('/api/v1/tenants', authFetcher)

  const handleDelete = async (id: string) => {
    if (!confirm('Tenant wirklich löschen?')) return

    try {
      await apiClient(`/api/v1/tenants/${id}`, { method: 'DELETE' })
      mutate('/api/v1/tenants')
    } catch (err: any) {
      alert('Fehler beim Löschen')
    }
  }

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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
            <p className="mt-1 text-sm text-gray-500">
              Alle Kunden und Projekte verwalten
            </p>
          </div>
          <Link
            href="/new-project"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Neuer Tenant
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {error ? (
            <div className="px-6 py-4 text-red-600">
              Fehler beim Laden: {error.message}
            </div>
          ) : !tenants ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              Laden...
            </div>
          ) : tenants.length === 0 ? (
            <div className="px-6 py-12 text-center">
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
                      Erstellt
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Aktionen</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tenants.map((tenant: any) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-700 font-medium text-sm">
                              {tenant.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {tenant.display_name || tenant.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {tenant.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {tenant.namespace}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tenant.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : tenant.status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tenant.created_at).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/tenants/${tenant.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(tenant.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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

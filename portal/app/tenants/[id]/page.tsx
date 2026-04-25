'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Navigation } from '@/components/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, Loader2, Shield, Clock, Server, Activity } from 'lucide-react'
import useSWR from 'swr'
import { authFetcher } from '@/lib/api-client'

export default function TenantDetailPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const tenantId = params?.id as string

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  const { data: tenants, error } = useSWR('/api/v1/tenants', authFetcher)
  const tenant = tenants?.find((t: any) => t.id === tenantId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Fehler beim Laden: {error.message}
          </div>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-lg font-medium text-gray-900">Tenant nicht gefunden</h2>
            <p className="mt-1 text-sm text-gray-500">ID: {tenantId}</p>
            <Link href="/tenants" className="mt-4 inline-block text-primary-600 hover:text-primary-500">
              Zurück zu Tenants
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/tenants"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück zu Tenants
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {tenant.display_name || tenant.name}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Namespace: <code className="bg-gray-100 px-1 py-0.5 rounded">{tenant.namespace}</code>
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              statusColors[tenant.status] || 'bg-gray-100 text-gray-800'
            }`}>
              {tenant.status}
            </span>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Grunddaten</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Server className="h-4 w-4 mr-1 text-gray-400" />
                  ID
                </dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{tenant.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Activity className="h-4 w-4 mr-1 text-gray-400" />
                  Status
                </dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{tenant.status}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-400" />
                  Erstellt
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(tenant.created_at).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-gray-400" />
                  Tier
                </dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{tenant.tier || 'standard'}</dd>
              </div>
            </dl>
          </div>

          {/* Quotas (if available) */}
          {tenant.quotas && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Ressourcen</h2>
              <dl className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="text-sm font-medium text-gray-500">CPU</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">{tenant.quotas.cpu || '—'}</dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="text-sm font-medium text-gray-500">Memory</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">{tenant.quotas.memory || '—'}</dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="text-sm font-medium text-gray-500">Storage</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">{tenant.quotas.storage || '—'}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Owner */}
          {tenant.owner_email && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Eigentümer</h2>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-lg font-medium text-primary-700">
                    {tenant.owner_email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">{tenant.owner_email}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Aktionen</h2>
          <div className="flex space-x-4">
            <Link
              href={`/tenants/${tenant.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Link>
            <button
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

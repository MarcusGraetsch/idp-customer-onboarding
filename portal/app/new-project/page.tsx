'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Navigation } from '@/components/navigation'
import Link from 'next/link'
import { PlusCircle, ArrowLeft, Check, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface FormData {
  name: string
  display_name: string
  owner_email: string
  tier: string
  quota_cpu: string
  quota_memory: string
  quota_storage: string
}

export default function NewProjectPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdTenant, setCreatedTenant] = useState<any>(null)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    display_name: '',
    owner_email: '',
    tier: 'standard',
    quota_cpu: '10',
    quota_memory: '20Gi',
    quota_storage: '100Gi',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await apiClient('/api/v1/tenants', {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      const tenants = await apiClient('/api/v1/tenants').then((res) => res.json())
      const tenant = tenants.find((t: any) => t.name === formData.name)
      setCreatedTenant(tenant)
      setStep(3)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { number: 1, title: 'Grunddaten', description: 'Name und Besitzer' },
    { number: 2, title: 'Ressourcen', description: 'Quotas und Tier' },
    { number: 3, title: 'Fertig', description: 'Zusammenfassung' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück zum Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Neues Projekt</h1>
          <p className="mt-1 text-sm text-gray-500">
            Erstellen Sie einen neuen Tenant
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.number} className="flex items-center">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
                  step >= s.number
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > s.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    s.number
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${step >= s.number ? 'text-gray-900' : 'text-gray-500'}`}>
                    {s.title}
                  </p>
                  <p className="text-xs text-gray-500">{s.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className={`ml-4 w-12 h-0.5 ${step > s.number ? 'bg-primary-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Step 1: Grunddaten */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Grunddaten</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  pattern="[a-z0-9-]+"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="z.B. mueller-gmbh"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Nur Kleinbuchstaben, Zahlen und Bindestriche. Wird für den Namespace verwendet.
                </p>
              </div>

              <div>
                <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
                  Anzeigename
                </label>
                <input
                  type="text"
                  name="display_name"
                  id="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  placeholder="z.B. Müller GmbH"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="owner_email" className="block text-sm font-medium text-gray-700">
                  Eigentümer Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="owner_email"
                  id="owner_email"
                  required
                  value={formData.owner_email}
                  onChange={handleChange}
                  placeholder="admin@beispiel.de"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.owner_email}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Weiter
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Ressourcen */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Ressourcen & Tier</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="tier" className="block text-sm font-medium text-gray-700">
                  Tier
                </label>
                <select
                  name="tier"
                  id="tier"
                  value={formData.tier}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="free">Free</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="quota_cpu" className="block text-sm font-medium text-gray-700">
                    CPU (Cores)
                  </label>
                  <input
                    type="text"
                    name="quota_cpu"
                    id="quota_cpu"
                    value={formData.quota_cpu}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="quota_memory" className="block text-sm font-medium text-gray-700">
                    Memory
                  </label>
                  <input
                    type="text"
                    name="quota_memory"
                    id="quota_memory"
                    value={formData.quota_memory}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="quota_storage" className="block text-sm font-medium text-gray-700">
                    Storage
                  </label>
                  <input
                    type="text"
                    name="quota_storage"
                    id="quota_storage"
                    value={formData.quota_storage}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Erstellen...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Tenant erstellen
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Erfolg */}
        {step === 3 && createdTenant && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Tenant erfolgreich erstellt!
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {createdTenant.display_name || createdTenant.name} ist jetzt bereit.
            </p>
            
            <div className="bg-gray-50 rounded-md p-4 mb-6 text-left">
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">ID</dt>
                  <dd className="text-sm text-gray-900">{createdTenant.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900">{createdTenant.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Namespace</dt>
                  <dd className="text-sm text-gray-900 font-mono">{createdTenant.namespace}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {createdTenant.status}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex justify-center space-x-4">
              <Link
                href="/tenants"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Alle Tenants
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Zum Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
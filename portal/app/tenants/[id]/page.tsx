// Detailansicht wird in Phase 2 implementiert
export default function TenantDetailPage({ params }: any) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Tenant Details</h1>
        <p className="mt-2 text-gray-600">ID: {params?.id}</p>
        <p className="mt-4 text-sm text-gray-500">
          Detailansicht wird in Phase 2 implementiert.
        </p>
      </div>
    </div>
  )
}
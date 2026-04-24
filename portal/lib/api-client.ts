// Zentraler API Client mit Auth
export async function apiClient(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('idp_access_token')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    // Token ungültig - zur Login Seite
    localStorage.removeItem('idp_access_token')
    localStorage.removeItem('idp_refresh_token')
    window.location.href = '/login'
    throw new Error('Session abgelaufen. Bitte neu anmelden.')
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }

  return res
}

// SWR Fetcher mit Auth
export const authFetcher = (url: string) => apiClient(url).then((res) => res.json())

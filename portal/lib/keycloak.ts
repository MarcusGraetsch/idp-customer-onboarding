// Keycloak OAuth2 + PKCE Flow für das Portal
// Dokumentation: docs/KEYCLOAK-SETUP.md

const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:30081'
const REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'idp-platform'
const CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'idp-portal'

// PKCE Helper (Browser-kompatibel)
async function generatePKCE() {
  const verifier = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const challenge = btoa(
    Array.from(new Uint8Array(hashBuffer))
      .map(b => String.fromCharCode(b))
      .join('')
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return { verifier, challenge }
}

// Keycloak URLs
export function getKeycloakUrls() {
  const base = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect`
  return {
    authorization: `${base}/auth`,
    token: `${base}/token`,
    logout: `${base}/logout`,
    userinfo: `${base}/userinfo`,
    certs: `${base}/certs`,
  }
}

// Login URL generieren
// Login URL generieren (async wegen PKCE)
export async function getLoginUrl(redirectUri: string): Promise<string> {
  const { verifier, challenge } = await generatePKCE()
  
  // PKCE Verifier speichern
  sessionStorage.setItem('pkce_verifier', verifier)
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: 'openid email profile roles',
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })


  return `${getKeycloakUrls().authorization}?${params}`
}

// Token mit Code austauschen
export async function exchangeCode(code: string, redirectUri: string) {
  const verifier = sessionStorage.getItem('pkce_verifier')
  if (!verifier) throw new Error('PKCE verifier nicht gefunden')

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  })

  const res = await fetch(getKeycloakUrls().token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })

  if (!res.ok) throw new Error('Token Exchange fehlgeschlagen')

  const data = await res.json()
  
  // Token speichern
  localStorage.setItem('idp_access_token', data.access_token)
  localStorage.setItem('idp_refresh_token', data.refresh_token)
  localStorage.setItem('idp_expires_at', String(Date.now() + data.expires_in * 1000))

  return data
}

// Token refreshen
export async function refreshToken() {
  const refreshToken = localStorage.getItem('idp_refresh_token')
  if (!refreshToken) throw new Error('Kein Refresh Token')

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  })

  const res = await fetch(getKeycloakUrls().token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })

  if (!res.ok) {
    // Token ungültig - ausloggen
    logout()
    throw new Error('Session abgelaufen')
  }

  const data = await res.json()
  localStorage.setItem('idp_access_token', data.access_token)
  localStorage.setItem('idp_refresh_token', data.refresh_token)
  localStorage.setItem('idp_expires_at', String(Date.now() + data.expires_in * 1000))

  return data.access_token
}

// Aktuellen Token holen (mit Refresh wenn nötig)
export async function getAccessToken(): Promise<string | null> {
  const token = localStorage.getItem('idp_access_token')
  const expiresAt = Number(localStorage.getItem('idp_expires_at'))

  if (!token) return null

  // Wenn Token in 60s abläuft, refreshen
  if (expiresAt && Date.now() > expiresAt - 60000) {
    try {
      return await refreshToken()
    } catch {
      return null
    }
  }

  return token
}

// Logout
export function logout() {
  localStorage.removeItem('idp_access_token')
  localStorage.removeItem('idp_refresh_token')
  localStorage.removeItem('idp_expires_at')
  sessionStorage.removeItem('pkce_verifier')

  // Keycloak Session auch beenden
  const refreshToken = localStorage.getItem('idp_refresh_token')
  if (refreshToken) {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    })
    navigator.sendBeacon(`${getKeycloakUrls().logout}?${params}`)
  }
}

// Userinfo abrufen
export async function getUserInfo() {
  const token = await getAccessToken()
  if (!token) return null

  const res = await fetch(getKeycloakUrls().userinfo, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) return null
  return res.json()
}

// Token parsen (Base64 JWT Payload)
export function parseToken(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name || payload.preferred_username,
      roles: payload.realm_access?.roles || [],
    }
  } catch {
    return null
  }
}

# IDP Platform — Erste Schritte

**Stand:** 2026-04-25  
**Portal:** `http://localhost:3000`  
**Keycloak:** `http://localhost:30081`  
**API:** `http://localhost:8080`

---

## Rolle 1: Plattformbetreiber / Admin

### 1.1 Keycloak Realm prüfen

1. **Keycloak Admin UI öffnen:** `http://localhost:30081/admin`
2. **Login:** `admin` / `admin123`
3. **Realm wechseln:** oben links auf `idp-platform`

#### Clients prüfen (sollten existieren):
- `idp-api` — für API Auth
- `idp-portal` — für Portal Login

#### User prüfen:
- `admin` — Plattform-Admin
- `demo` — Test-User (Passwort: `demo123`)

#### Rollen prüfen:
- `platform_admin` — Vollzugriff
- `tenant_admin` — Tenant-Verwaltung

---

### 1.2 Neuen Tenant anlegen (Admin)

1. **Portal öffnen:** `http://localhost:3000`
2. **Login mit Admin-Account** (Keycloak SSO)
3. **Navigieren zu:** `Admin` → `Neuen Tenant erstellen`
4. **Daten eingeben:**
   - Name: z.B. `acme-corp`
   - Anzeigename: z.B. `ACME Corporation`
   - Eigentümer Email: `admin@acme.de`
   - Tier: `standard`
5. **Tenant erstellen**

---

### 1.3 Neuen Nutzer für Tenant anlegen

1. **Keycloak Admin UI:** `http://localhost:30081/admin`
2. **Realm:** `idp-platform`
3. **Users:** → `Add user`
4. **Daten:**
   - Username: z.B. `mueller`
   - Email: `h.muller@acme.de`
   - First Name: `Hans`
   - Last Name: `Müller`
5. **Rollen zuweisen:**
   - User öffnen → `Role Mappings` → `Client Roles` → `idp-api`
   - Rolle hinzufügen: `tenant_admin` (für diesen Tenant)

---

### 1.4 Dem Nutzer Tenant-Zugriff geben

**Variante A: Über Keycloak (manuell)**
1. Keycloak → Users → User auswählen
2. `Attributes` → hinzufügen: `tenant_id: <tenant-uuid>`

**Variante B: Über API**
```bash
# Token holen
TOKEN=$(curl -s -X POST http://localhost:30081/realms/idp-platform/protocol/openid-connect/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=password&client_id=idp-api&username=demo&password=demo123' | jq -r '.access_token')

# Tenant-User zuweisen
curl -X POST http://localhost:8080/api/v1/tenants/<TENANT_ID>/users \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"user_id": "<user-id>", "role": "tenant_admin"}'
```

---

## Rolle 2: Nutzer / Kunde

### 2.1 Erste Anmeldung

1. **Portal öffnen:** `http://localhost:3000/login`
2. **Auf "Mit Keycloak anmelden" klicken**
3. **Keycloak Login:**
   - Username: `demo`
   - Passwort: `demo123`
4. **Wird auf Dashboard weitergeleitet**

---

### 2.2 Dashboard

Das Dashboard zeigt:
- Übersicht über **Ihre Tenants**
- **Schnellaktionen** für Tenant erstellen/verwalten
- **Letzte Tenants** Liste

---

### 2.3 Neuen Tenant beantragen

1. **Dashboard** → `Neuen Tenant erstellen`
2. **Daten eingeben:**
   - Name: z.B. `meine-firma` (Kleinbuchstaben, nur a-z, 0-9, -)
   - Anzeigename: z.B. `Meine Firma GmbH`
   - Eigentümer Email: Ihre Email
   - Tier: `free`, `standard` oder `premium`
3. **Quotas auswählen** (je nach Tier)
4. **Tenant erstellen** klicken

---

### 2.4 Tenant verwalten

1. **Navigation** → `Tenants`
2. **Eigenen Tenant auswählen** (oder alle Tenants sehen wenn Admin)
3. **Tenant-Details:**
   - ID, Namespace, Status
   - Ressourcen-Quotas
   - Eigentümer-Info
4. **Aktionen:**
   - Bearbeiten (Name, Quotas)
   - Löschen (mit Bestätigung)

---

### 2.5 Profil anzeigen

1. **Navigation** → Avatar/E-Mail oben rechts → `Profil`
2. **Daten sehen:**
   - E-Mail
   - Benutzer-ID
   - Zugewiesene Rollen
   - Authentifizierungs-Status

---

## Quick Reference

### Zugangsdaten

| Service | URL | Login |
|---------|-----|-------|
| Portal | http://localhost:3000 | Keycloak SSO |
| Keycloak Admin | http://localhost:30081/admin | admin/admin123 |
| API | http://localhost:8080 | JWT Bearer Token |

### Demo-Accounts

| User | Passwort | Rolle |
|------|----------|-------|
| demo | demo123 | tenant_admin |
| admin | admin123 | platform_admin |

### API Endpoints

```
GET    /api/v1/tenants              # Alle Tenants (Admin) oder eigene (User)
POST   /api/v1/tenants             # Neuen Tenant erstellen
GET    /api/v1/tenants/:id         # Tenant Details
PUT    /api/v1/tenants/:id         # Tenant aktualisieren
DELETE /api/v1/tenants/:id         # Tenant löschen
```

### Nächste Schritte (TODO)

- [ ] **Keycloak Realm exportieren** für Produktion
- [ ] **Echte E-Mail Konfiguration** (Keycloak SMTP)
- [ ] **Admin Page Rollen-Prüfung** einbauen
- [ ] **Tenant Edit Page** bauen
- [ ] **CVE Scan Integration** (Trivy)
- [ ] **Dokumentation finalisieren**

---

*Erstellt: 2026-04-25*

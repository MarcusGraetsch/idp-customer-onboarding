# IDP Self-Service Platform — Architecture

> **POC Draft** — 2026-04-22

---

## Vision

Kunden (intern/extern) können per Web-UI ihren eigenen Cluster erstellen, skalieren und löschen — ohne Kubernetes-Kenntnisse. Ähnlich wie Ionos/Cloud-Provider, aber firmenintern.

---

## Environments

```
┌─────────────────────────────────────────────────────────┐
│                    platform-prod                         │
│   Kunden (intern/extern), Live-System, SLAs              │
│   Kubernetes Cluster (customer-facing)                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    platform-dev                          │
│   Plattform-Maintainer entwickeln hier                   │
│   Neue Features testen, CI/CD prüfen                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    idp-lab (bereits vorhanden)           │
│   Experimentelle Plattform-Features                      │
│   POC-Features werden hier getestet                      │
└─────────────────────────────────────────────────────────┘
```

---

## Roles & Permissions

### Customer Roles

| Role | Permissions |
|------|-------------|
| `platform-admin` | Alles: Cluster erstellen/löschen, User verwalten, Quotas setzen |
| `internal-dev` | Cluster erstellen/skalieren/löschen in eigenen Namespaces |
| `external-customer` | Nur eigene Namespaces; Cluster-Status sehen; keine Admin-Rechte |

### Platform Maintainer Roles

| Role | Permissions |
|------|-------------|
| `platform-developer` | Code ändern, in dev deployen, keine Prod-Änderungen |
| `platform-ops` | Prod-Deployments, Incident-Response, Configuration |
| `platform-support` | Tickets sehen, Support leisten, keine technischen Änderungen |
| `platform-manager` | Approvals für Quotas, Billing, Eskalationen |

---

## Components

### 1. Web UI (Frontend)
- **Next.js** + TailwindCSS
- Dropdowns: Cluster-Größe, Region, Add-ons
- Self-Service: erstellen, scale, löschen, status
- Login via Keycloak (OIDC)

### 2. API (Backend)
- **Node.js** (Fastify)
- RESTful + WebSocket für Status-Updates
- Multi-Environment-fähig
- Endpoints: Clusters, Tickets, Approvals, Addons, Regions

### 3. Cluster Registry
- **PostgreSQL** (Schema: `platform.clusters`, `platform.tickets`, `platform.approvals`)
- Nur via API zugänglich

### 4. GitOps Layer
- **Flux** auf dem Management-Cluster
- Cluster Templates in `cluster-templates/` Repo

### 5. Multi-Tenant Isolation
- RBAC via Keycloak
- Quotas (CPU, Memory, Namespaces)
- NetworkPolicies zwischen Tenants

---

## Tech Stack (POC)

| Layer | Technology |
|-------|------------|
| UI | Next.js + TailwindCSS |
| API | Node.js (Fastify) |
| Auth | Keycloak (OIDC) — vorhanden |
| Provisioning | Flux + Kustomize |
| Cluster Templates | Git-Repo mit Kustomize Overlays |
| Registry DB | PostgreSQL |
| Ticket DB | PostgreSQL (same instance, separate schema) |
| Monitoring | Prometheus + Grafana |
| CI/CD | GitHub Actions |
| Notifications | E-Mail (SMTP), Telegram Bot |

---

## API Spec

```
GET    /health                 → { status, timestamp }
GET    /api/addons             → [Addons]
GET    /api/regions            → [Regions]
POST   /api/clusters           → { cluster }
GET    /api/clusters           → [Cluster]
GET    /api/clusters/:id       → Cluster
PUT    /api/clusters/:id/scale → { cluster }
DELETE /api/clusters/:id       → { deleted }
POST   /api/tickets            → { ticket }
GET    /api/tickets            → [Ticket]
GET    /api/tickets/:id        → Ticket
POST   /api/approvals          → { approval }
GET    /api/approvals          → [Approval]
PUT    /api/approvals/:id      → { approval }
```

---

## Datenmodell (Registry)

### Cluster

```yaml
Cluster:
  id: uuid
  name: string
  owner: string
  customer_type: internal-dev | external-customer
  provider: kind | hetzner | aws | ionos
  size: small | medium | large
  region: string
  addons: [trivy, polaris, monitoring, ingress]
  status: provisioning | running | scaling | error | deleted
  nodes: int
  environment: dev | prod
  created_at: timestamp
  updated_at: timestamp
```

### Ticket

```yaml
Ticket:
  id: uuid
  customer_id: string
  type: incident | problem | request | question
  status: open | in_progress | resolved | closed | reopened
  priority: low | medium | high | critical
  subject: string
  description: text
  assigned_to: string
  created_at: timestamp
  updated_at: timestamp
  resolved_at: timestamp
  sla_deadline: timestamp
```

### Approval

```yaml
Approval:
  id: uuid
  type: cluster_create | quota_increase | region_enable | platform_update
  status: pending | approved | rejected
  requester: string
  approver: string
  reason: string
  created_at: timestamp
  resolved_at: timestamp
```

---

## Testing URLs (von VM Browser)

```
http://argocd.platform-dev.idp.local     → ArgoCD UI
http://keycloak.platform-dev.idp.local   → Keycloak
http://polaris.platform-dev.idp.local     → Polaris Dashboard
http://grafana.platform-dev.idp.local     → Grafana
http://api.platform-dev.idp.local/api/addons → API (über Nginx)
```

---

## TODO

### ✅ Completed

- [x] Architektur dokumentiert (dieses Doc)
- [x] PostgreSQL in `platform-dev` (bitnami helm, 1Gi PVC)
- [x] Schema: `platform.clusters`, `platform.tickets`, `platform.approvals`
- [x] API-Server: Fastify, Node.js, alle Endpoints
- [x] GitHub Repo: `idp-customer-onboarding` committed
- [x] Nginx reverse proxy auf VM (Port 80)
- [x] /etc/hosts mit allen platform-dev.idp.local Einträgen
- [x] Flux Token für GitHub Repos konfiguriert

### 🔧 Manual Setup Required

**ghcr.io Image Repository:**
- Repository: `ghcr.io/marcusgraetsch/platform-api`
- Problem: K8s kann das Image nicht pullen (403 Forbidden)
- **Lösung:** GitHub → Settings → Packages → `platform-api` → Make public

**Docker Hub Auth (alternativ):**
- Falls ghcr.io nicht funktioniert: Docker Hub login auf VM:
  ```bash
  docker login
  # Credentials eingeben
  ```

**Image in Kind laden (lokal):**
```bash
docker save ghcr.io/marcusgraetsch/platform-api:latest -o /tmp/platform-api.tar
kind load image-archive /tmp/platform-api.tar --name rook-lab
```

### ⏳ Open

- [ ] ghcr.io repo public machen
- [ ] Keycloak Roles für internal-dev/external-customer konfigurieren
- [ ] ArgoCD SSO mit Keycloak testen
- [ ] Next.js UI scaffold (Customer Portal)
- [ ] Cluster-Templates Repo erstellen
- [ ] Flux-Template für Cluster-Bootstrap
- [ ] GitHub Actions CI/CD Workflows

### 📋 K8s Deployment Checklist

1. ghcr.io repo public machen
2. `kubectl apply -f platform-api/k8s/deployment.yaml`
3. Keycloak: Client `platform-api` anlegen mit redirect URIs
4. Next.js UI deployen
5. ArgoCD Applications für platform-dev anlegen

---

*Letzte Änderung: 2026-04-22*
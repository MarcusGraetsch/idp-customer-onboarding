# IDP Self-Service Platform — Architecture

> **POC Draft** — 2026-04-22

---

## Vision

Kunden (intern/extern) können per Web-UI ihren eigenen Cluster erstellen, skalieren und löschen — ohne Kubernetes-Kenntnisse. Ähnlich wie Ionos/Cloud-Provider, aber firmenintern.

---

## Roles & Permissions

| Role | Permissions |
|------|-------------|
| `platform-admin` | Alles: Cluster erstellen/löschen, User verwalten, Quotas setzen, alle Namespaces |
| `internal-dev` | Cluster erstellen/skalieren/löschen in eigenen Namespaces; eigene Images bauen |
| `external-customer` | Nur eigene Namespaces; Cluster-Status sehen; keine Admin-Rechte |

---

## Components

### 1. Web UI (Frontend)
- **React/Next.js**
- Dropdowns: Cluster-Größe, Region, Add-ons
- Self-Service: erstellen, scale, löschen, status
- Login via Keycloak (OIDC)

### 2. API (Backend)
- **Go** oder **Node.js** API-Server
- RESTful + WebSocket für Status-Updates
- Endpoints:
  - `POST /clusters` — Cluster erstellen
  - `GET /clusters/:id` — Status
  - `PUT /clusters/:id/scale` — Nodes add/remove
  - `DELETE /clusters/:id` — Cluster löschen
  - `GET /namespaces` — Liste eigene Namespaces

### 3. Cluster Registry
- PostgreSQL oder CRD im Management-Cluster
- Track: Cluster-ID, Status, Konfiguration, Owner, Cloud-Provider
- Versionierung der Cluster-Configs

### 4. Infrastructure Backend (Abstraction Layer)
```
Provider Interface:
  - createCluster(config) → cluster
  - scaleCluster(cluster, nodes) → updated
  - deleteCluster(cluster) → void
  - getClusterStatus(cluster) → status

Implementations:
  - Hetzner (HCloud)
  - IONOS
  - AWS (EKS)
  - Local (Kind — für POC)
  - On-Prem (Kubeadm on VMs)
```

### 5. GitOps Layer
- Flux auf dem Management-Cluster
- Neue Cluster = neue Flux Kustomizations
- Templates in `cluster-templates/` Repo

### 6. Multi-Tenant Isolation
- RBAC via Keycloak
- Quotas (CPU, Memory, Namespaces)
- NetworkPolicies zwischen Tenants

### 7. Observability
- Prometheus + Grafana pro Cluster
- Zentrales Dashboard im Management-Cluster
- Alertmanager für Ausfälle

---

## Cluster-Auswahl (Kunde)

| Option | Values |
|--------|--------|
| Größe | `small` (1x), `medium` (3x), `large` (5x) |
| Provider | (POC: Kind/local) — später: Hetzner, AWS, Ionos |
| Region | (POC: local) — später: fsn1, ash, etc. |
| Add-ons | Trivy ✓, Polaris ✓, Monitoring ✓, Ingress ✓ |

---

## Datenmodell (Registry)

```yaml
Cluster:
  id: uuid
  name: string
  owner: string (user/team)
  role: internal-dev | external-customer
  provider: kind | hetzner | aws | ionos
  size: small | medium | large
  region: string
  addons: [trivy, polaris, monitoring, ingress]
  status: provisioning | running | scaling | error | deleted
  nodes: int
  created_at: timestamp
  updated_at: timestamp
```

---

## Tech Stack (POC)

| Layer | Technology |
|-------|------------|
| UI | Next.js + TailwindCSS |
| API | Node.js (Express oder Fastify) |
| Auth | Keycloak (OIDC) |
| Provisioning | Flux + Kustomize |
| Cluster Templates | Git-Repo mit Kustomize Overlays |
| Registry | PostgreSQL (via API, keine direkte Kundenzugriffe) |
| Monitoring | Prometheus + Grafana (auf Management-Cluster) |

---

## API Spec

```
POST   /api/clusters          → { id, status }
GET    /api/clusters          → [Cluster]
GET    /api/clusters/:id      → Cluster
PUT    /api/clusters/:id/scale→ { nodes }
DELETE /api/clusters/:id      → { deleted }

GET    /api/addons            → [verfügbare Add-ons]
GET    /api/regions           → [verfügbare Regionen]
```

---

## TODO

- [ ] POC-Architektur finalisieren
- [ ] Cluster-Templates Repo erstellen
- [ ] API-Server scaffold
- [ ] UI scaffold mit Keycloak-Login
- [ ] Keycloak-Integration (Roles für internal/external)
- [ ] Kind als erster Provider (lokal testen)
- [ ] Flux-Template für Cluster-Bootstrap
- [ ] Registry-DB Design
- [ ] Quota-System designen
- [ ] Monitoring-Stack designen
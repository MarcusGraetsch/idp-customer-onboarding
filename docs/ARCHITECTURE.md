# IDP Self-Service Platform — Architecture

> **POC Draft** — 2026-04-22

---

## Vision

Kunden (intern/extern) können per Web-UI ihren eigenen Cluster erstellen, skalieren und löschen — ohne Kubernetes-Kenntnisse. Ähnlich wie Ionos/Cloud-Provider, aber firmenintern.

---

## Environments

### Environment Strategy

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
│   Bevor sie nach platform-dev kommen                   │
└─────────────────────────────────────────────────────────┘
```

### Environment Policy

| Umgebung | Zugang | Deployment | Änderungen |
|----------|--------|------------|------------|
| `idp-lab` | Plattform-Team | Frei, jederzeit | Experimente |
| `platform-dev` | Plattform-Maintainer | Nur nach CI/CD Pipeline | Neues testen |
| `platform-prod` | Kunden + Maintainer | Nur via CI/CD + Approval | Changes必须有 Review |

---

## Roles & Permissions

### Customer Roles

| Role | Permissions |
|------|-------------|
| `platform-admin` | Alles: Cluster erstellen/löschen, User verwalten, Quotas setzen, alle Namespaces |
| `internal-dev` | Cluster erstellen/skalieren/löschen in eigenen Namespaces; eigene Images bauen |
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
- **Next.js** (React)
- Dropdowns: Cluster-Größe, Region, Add-ons
- Self-Service: erstellen, scale, löschen, status
- Login via Keycloak (OIDC)
- **Separate Portale:**
  - Customer Portal (Kunden-UI)
  - Admin Portal (Plattform-Maintainer)
  - Support Portal (Tickets, Support-View)

### 2. API (Backend)
- **Node.js** (Fastify) — schnell, typsicher
- RESTful + WebSocket für Status-Updates
- Multi-Environment-fähig (dev/prod Konfiguration)
- Endpoints:
  - `POST /api/clusters` — Cluster erstellen
  - `GET /api/clusters/:id` — Status
  - `PUT /api/clusters/:id/scale` — Nodes add/remove
  - `DELETE /api/clusters/:id` — Cluster löschen
  - `GET /api/namespaces` — Liste eigene Namespaces

### 3. Cluster Registry
- **PostgreSQL** — nur für Plattform-Admins direkt
- API-Server als einziger Zugriffspunkt
- Track: Cluster-ID, Status, Konfiguration, Owner, Cloud-Provider, Environment
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
- **Flux** auf dem Management-Cluster
- Neue Cluster = neue Flux Kustomizations
- Templates in `cluster-templates/` Repo
- Environment-spezifische Overlays (`overlays/dev`, `overlays/prod`)

### 6. Multi-Tenant Isolation
- RBAC via Keycloak
- Quotas (CPU, Memory, Namespaces)
- NetworkPolicies zwischen Tenants
- Separate Namespaces pro Kunde

### 7. Observability
- Prometheus + Grafana pro Cluster
- Zentrales Dashboard im Management-Cluster
- Alertmanager für Ausfälle
- **Plattform-Monitoring:** Cluster-Health, API-Latency, Error-Rates

---

## Platform Maintainer Workflow

### Ticket-System

Klassische Support-Tickets für:
- Cluster-Probleme (nicht direkt lösbar durch Kunde)
- Quota-Anfragen
- Neue Feature-Requests
- Bug-Reports

```
Ticket States:
  open → in_progress → resolved → closed
                              ↗ reopened
```

**Ticket-Typen:**

| Type | Beschreibung | SLA |
|------|-------------|-----|
| `incident` | Cluster down, nicht nutzbar | 1h |
| `problem` | Funktioniert, aber langsam/fehlerhaft | 8h |
| `request` | Quota-Erweiterung, neue Region | 24h |
| `question` | Wie funktioniert X? | 48h |

### Approval Workflows

| Action | Approval Required | Approver |
|--------|-----------------|----------|
| Cluster erstellen (dev) | Nein | Auto |
| Cluster erstellen (prod, external) | Ja | platform-ops |
| Quota erhöhen | Ja | platform-manager |
| Region freischalten | Ja | platform-manager |
| Plattform-Update (prod) | Ja | platform-ops + platform-manager |
| On-Demand Backup | Nein | Auto |

### Notifications

| Event | Who | Channel | Priority |
|-------|-----|---------|----------|
| Cluster erstellt | Customer | E-Mail + UI | Low |
| Cluster-Provision fehlgeschlagen | Customer + Support | E-Mail + Telegram | High |
| Quota-Limit erreicht | Customer | UI | Medium |
| Incident (Prod) | Plattform-Team | Telegram + E-Mail | Critical |
| Neue Plattform-Version | Platform-Team | GitHub + UI | Low |
| Ticket erstellt | Support | E-Mail | Medium |
| Ticket eskaliert | Manager | Telegram | High |

---

## CI/CD für die Plattform selbst

### Pipeline

```
Pull Request → CI (Tests + Lint) → Merge → 
→ Deploy to Dev (Auto) → 
→ Approval (Change-Request) → 
→ Deploy to Prod
```

### GitHub Actions Workflow

```yaml
# .github/workflows/platform-ci.yml

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test
      - name: Lint
        run: npm run lint

  deploy-dev:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to platform-dev
        run: kubectl apply -k overlays/dev

  deploy-prod-approval:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: platform-prod
    steps:
      - name: Create Change-Request Ticket
        run: gh issue create --label "change-request" ...
      - name: Wait for Approval
        run: |
          # Check for approval label or comment
      - name: Deploy to platform-prod
        run: kubectl apply -k overlays/prod
```

### Deployment Environments (Kubernetes)

```
┌─────────────────────────────────────────────────────────┐
│                  platform-dev Namespace                  │
│   API Server, UI, Registry (Dev-DB)                      │
│   Nur für Plattform-Maintainer                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  platform-prod Namespace                 │
│   API Server, UI, Registry (Prod-DB)                     │
│   Für alle Kunden                                       │
└─────────────────────────────────────────────────────────┘
```

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

### Cluster

```yaml
Cluster:
  id: uuid
  name: string
  owner: string (user/team)
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
  assigned_to: string (platform-support oder platform-ops)
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
POST   /api/clusters            → { id, status }
GET    /api/clusters            → [Cluster]
GET    /api/clusters/:id        → Cluster
PUT    /api/clusters/:id/scale  → { nodes }
DELETE /api/clusters/:id        → { deleted }

GET    /api/addons              → [verfügbare Add-ons]
GET    /api/regions             → [verfügbare Regionen]

POST   /api/tickets             → { id }
GET    /api/tickets             → [Ticket]
GET    /api/tickets/:id         → Ticket
PUT    /api/tickets/:id         → Ticket

POST   /api/approvals            → { id }
GET    /api/approvals           → [Approval]
PUT    /api/approvals/:id       → Approval (approve/reject)
```

---

## TODO

### Architecture
- [x] POC-Architektur finalisieren
- [ ] Dev/Prod-Trennung finalisieren
- [ ] CI/CD Pipeline designen
- [ ] Maintainer-Workflow (Tickets, Approvals) designen

### Core Infrastructure
- [ ] Next.js UI scaffold
- [ ] Node.js API-Server scaffold
- [ ] PostgreSQL installieren (dev + prod)
- [ ] Keycloak-Integration (Rollen für internal/external)
- [ ] GitHub Actions Workflows

### Cluster Management
- [ ] Cluster-Templates Repo erstellen
- [ ] Flux-Template für Cluster-Bootstrap
- [ ] Kind als erster Provider (lokal testen)
- [ ] Provider-Abstraction Layer

### Operations
- [ ] Ticket-System implementieren
- [ ] Approval-Workflow implementieren
- [ ] Notification-System (E-Mail + Telegram)
- [ ] Monitoring-Stack designen
- [ ] Quota-System designen

### Testing
- [ ] End-to-End Tests (Kunde kann Cluster erstellen)
- [ ] Load Tests
- [ ] Security Audit
# Agent-Native IDP — Architektur-Dokumentation

> Projekt: `idp-customer-onboarding`
> Vision: Kubernetes als Managed Platform für Menschen UND Agenten
> Sprache: Go (Backend), TypeScript/React (Frontend)
> Stand: 2026-04-23

---

## 🎯 Vision

Eine **Internal Developer Platform (IDP)**, die gleichzeitig für **Menschen** (UI) und **Agenten** (API) zugänglich ist.

Die zentrale Idee: Agenten und Menschen nutzen **dieselbe Logik**, nur unterschiedliche Interfaces.

### Warum "Agent-Native"?

| Traditional IDP | Agent-Native IDP |
|-----------------|------------------|
| Mensch klickt "Neues Projekt" | Agent sagt: "Erstelle Tenant Müller mit Postgres + Redis" |
| Mensch liest Logs in Grafana | Agent liest Logs, erkennt Muster, schlägt Fixes vor |
| Mensch konfiguriert ArgoCD | Agent deployt direkt via GitOps API |
| Support-Ticket: "App ist down" | Agent bemerkt es vorher, restartet Pod, informiert Kunden |

### Marktlücke

- **Backstage** (Spotify): Developer Portal für Menschen, kein Agent-Interface
- **Rancher/OpenShift**: Multi-Tenant K8s, aber nicht Agent-Native
- **GitHub Copilot**: Code-Assistenz, kein Infrastructure-Management
- **SwarmClaw**: Multi-Agent, aber keine Kubernetes-Integration

**Unser Ansatz**: Ein Portal, das gleichzeitig UI für Menschen und API für Agenten ist.

---

## 🏗️ Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT-NATIVE IDP                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐      ┌──────────────────────────┐    │
│  │   Human Layer    │      │      Agent Layer         │    │
│  │  ┌────────────┐  │      │  ┌────────────────────┐  │    │
│  │  │ React/Next │  │      │  │ REST API           │  │    │
│  │  │   .js UI   │  │      │  │ - OpenAPI Spec     │  │    │
│  │  │            │  │      │  │ - Webhooks         │  │    │
│  │  │ - Dashboard│  │      │  │ - Event Stream     │  │    │
│  │  │ - Self-Serv│  │      │  │ - Async Jobs       │  │    │
│  │  │ - Logs/Metr│  │      │  │                    │  │    │
│  │  │ - Cost Ctr │  │      │  │ Rook/You/Other     │  │    │
│  │  └────────────┘  │      │  │   Agents           │  │    │
│  └────────┬─────────┘      └───────────┬────────────┘    │
│           │                            │                  │
│           └────────────┬───────────────┘                  │
│                        │                                   │
│              ┌─────────▼──────────┐                       │
│              │   Platform Core    │                       │
│              │                    │                       │
│              │ - Tenant Mgmt      │                       │
│              │ - RBAC (Keycloak)  │                       │
│              │ - GitOps (Flux)    │                       │
│              │ - Policy (OPA)     │                       │
│              │ - Billing/Quota    │                       │
│              │ - Audit Log        │                       │
│              │ - Event Bus        │                       │
│              └─────────┬──────────┘                       │
│                        │                                   │
│    ┌───────────────────┼───────────────────┐              │
│    │                   │                   │              │
│ ┌──▼───┐        ┌─────▼─────┐      ┌──────▼─────┐       │
│ │ K8s  │        │  ArgoCD   │      │  Keycloak  │       │
│ │ API  │        │   API     │      │   API      │       │
│ └──────┘        └───────────┘      └────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📐 Schichten

### 1. Presentation Layer

| Komponente | Tech | Zweck |
|------------|------|-------|
| Human UI | Next.js 14 + shadcn/ui | Self-Service Portal für Menschen |
| Agent API | Go (Fiber/Echo) | REST API für Agenten |
| WebSocket | Go (gorilla/websocket) | Real-time Events für UI + Agents |

### 2. Business Logic Layer

| Komponente | Tech | Zweck |
|------------|------|-------|
| Tenant Service | Go | CRUD für Tenants, Namespaces, Quotas |
| GitOps Service | Go | Flux/ArgoCD Integration, App Deployment |
| Policy Service | Go | OPA Gatekeeper Policy Management |
| Identity Service | Go | Keycloak User/Group/Role Management |
| Billing Service | Go | Resource Usage, Cost Allocation |
| Audit Service | Go | Audit Log, Compliance Reports |

### 3. Data Layer

| Komponente | Tech | Zweck |
|------------|------|-------|
| Primary DB | PostgreSQL | Tenants, Users, Configs |
| Cache | Redis | Sessions, Rate Limits, Events |
| Object Storage | MinIO/S3 | Trivy Reports, Backups |
| Event Bus | NATS/Redis PubSub | Async Events zwischen Services |

### 4. Infrastructure Layer

| Komponente | Tech | Zweck |
|------------|------|-------|
| Kubernetes | kind/prod | Workload Orchestration |
| GitOps | Flux + ArgoCD | Declarative Deployments |
| SSO | Keycloak | Identity Provider |
| Policies | OPA Gatekeeper | Security Policies |
| Monitoring | Prometheus + Grafana | Metrics, Logs, Alerts |
| Scanning | Trivy + kube-bench | CVE + Compliance Scans |

---

## 🔌 API Design

### REST Endpoints

```
POST   /api/v1/tenants              → Tenant erstellen
GET    /api/v1/tenants              → Liste eigener Tenants
GET    /api/v1/tenants/:id          → Tenant Details
PUT    /api/v1/tenants/:id          → Tenant aktualisieren
DELETE /api/v1/tenants/:id          → Tenant löschen (soft)

POST   /api/v1/tenants/:id/apps     → App deployen
GET    /api/v1/tenants/:id/apps     → Apps liste
GET    /api/v1/tenants/:id/logs     → Logs streamen
GET    /api/v1/tenants/:id/metrics  → Metriken abrufen

POST   /api/v1/tenants/:id/secrets  → Secret erstellen
GET    /api/v1/tenants/:id/secrets  → Secrets liste

POST   /api/v1/events/subscribe     → Events abonnieren (WebSocket)
GET    /api/v1/audit-log            → Audit Log (nur Admin)
```

### Event Types (WebSocket/Webhook)

```json
{
  "type": "tenant.created",
  "timestamp": "2026-04-23T10:00:00Z",
  "data": {
    "tenant_id": "mueller-gmbh",
    "namespace": "tenant-mueller",
    "created_by": "agent:rook"
  }
}
```

Weitere Events:
- `tenant.updated`, `tenant.deleted`
- `app.deployed`, `app.failed`
- `policy.violation`
- `scan.completed` (Trivy, kube-bench, Polaris)
- `resource.quota_exceeded`

---

## 🗄️ Datenbankschema (MVP)

```sql
-- Tenants (Kunden/Projekte)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(63) UNIQUE NOT NULL,  -- DNS-kompatibel
    display_name VARCHAR(255),
    tier VARCHAR(50) DEFAULT 'standard', -- free, standard, premium
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, deleted
    owner_email VARCHAR(255),
    namespace VARCHAR(63) UNIQUE,
    keycloak_realm VARCHAR(255),
    quota_cpu VARCHAR(50) DEFAULT '10',
    quota_memory VARCHAR(50) DEFAULT '20Gi',
    quota_storage VARCHAR(50) DEFAULT '100Gi',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Users (Keycloak-Referenzen)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user', -- admin, platform_admin, user
    tenant_id UUID REFERENCES tenants(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apps (Deployments)
CREATE TABLE apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(63) NOT NULL,
    image VARCHAR(255),
    replicas INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending',
    git_repo VARCHAR(500),
    git_branch VARCHAR(100) DEFAULT 'main',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor VARCHAR(255), -- user:email oder agent:name
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100), -- tenant, app, secret
    resource_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events (für Event Bus / WebSocket)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 Authentifizierung & Autorisierung

### Menschen
- Login via Keycloak (OIDC)
- JWT Token mit Claims: `tenant_id`, `role`
- RBAC: Jeder sieht nur seinen Tenant

### Agenten
- API Key oder mTLS
- Scoped Access: Agent darf nur bestimmte Actions ausführen
- Beispiel: `agent:rook` darf Tenants erstellen, aber nicht löschen

---

## 🚀 Roadmap

### Phase 0: Foundation (Jetzt)
- [ ] Go Backend mit Fiber
- [ ] PostgreSQL + Schema
- [ ] Tenant CRUD API
- [ ] K8s Namespace Erstellung
- [ ] Keycloak Integration

### Phase 1: MVP Portal
- [ ] Next.js UI
- [ ] Login / Dashboard
- [ ] "Neues Projekt" Wizard
- [ ] App Deployment Status

### Phase 2: Agent API
- [ ] OpenAPI Spec
- [ ] WebSocket Events
- [ ] Async Job Queue
- [ ] Erste Agent-Integration (Rook)

### Phase 3: Self-Service
- [ ] Kunden können Apps deployen
- [ ] Secrets Management
- [ ] Rechte vergeben
- [ ] Grafana-Integration

### Phase 4: Agent-Native
- [ ] Autonome Agent-Operationen
- [ ] Self-Healing (Agent restartet Pods)
- [ ] Predictive Alerts
- [ ] Multi-Cluster Support

---

## 🛠️ Tech Stack

| Layer | Tech | Begründung |
|-------|------|-----------|
| Backend | Go (Fiber) | K8s-Nähe, Performance, Typ-Sicherheit |
| Frontend | Next.js + shadcn/ui | React-Ökosystem, gute DX |
| DB | PostgreSQL | Zuverlässig, JSONB für Flexibilität |
| Cache | Redis | Sessions, PubSub, Rate Limiting |
| Events | NATS oder Redis PubSub | Leichtgewichtig, gut für MVP |
| K8s Client | client-go | Offiziell, vollständig |
| Auth | Keycloak | Ist schon da, OIDC-Standard |
| GitOps | Flux/ArgoCD APIs | Direkte Integration ohne Hacks |

---

## 📁 Projektstruktur

```
idp-customer-onboarding/
├── README.md
├── ARCHITECTURE.md          ← Diese Datei
├── api/                     ← Go Backend
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   ├── internal/
│   │   ├── config/
│   │   ├── handlers/
│   │   ├── models/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── k8s/
│   ├── pkg/
│   │   └── events/
│   ├── migrations/
│   ├── Dockerfile
│   └── go.mod
├── portal/                  ← Next.js Frontend
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
├── docs/                    ← Projektdokumentation
│   ├── onboarding-guide.md
│   ├── api-reference.md
│   └── shared-responsibilities.md
└── scripts/                 ← Hilfsskripte
    ├── setup-kind.sh
    └── seed-db.sh
```

---

## 🎓 Go Lernpfad für Marcus

> "Ich kann Go dir on the go beibringen" — Rook

### Woche 1: Grundlagen
- Go Syntax (ähnlich C, aber simpler)
- Structs und Interfaces (statt Klassen)
- Goroutines und Channels (Concurrency)
- Standard-Library (net/http, encoding/json)

### Woche 2: Projekt-Spezifisch
- Fiber Framework (ähnlich Express.js)
- GORM oder sqlx (Datenbank)
- client-go (Kubernetes API)
- JWT und Middleware

### Woche 3: Fortgeschritten
- Context (Timeouts, Cancellation)
- Error Handling (Go-Idiom)
- Testing (Tabelle-driven Tests)
- Docker Multi-Stage Builds

**Ressourcen:**
- [A Tour of Go](https://tour.golang.org/) — Offiziell, interaktiv
- [Go by Example](https://gobyexample.com/) — Praxisnah
- [Effective Go](https://go.dev/doc/effective_go) — Best Practices

---

## 🤝 Konventionen

### Code-Stil
- `gofmt` automatisch (keine Diskussion über Formatierung)
- Package-Namen: kurz, klein, keine CamelCase
- Error Handling: explizit, keine Exceptions
- Kommentare: nur wenn nötig, aber dann auf Deutsch

### Git
- Branch: `feature/`, `bugfix/`, `docs/`
- Commits auf Deutsch
- PRs mit Beschreibung

### API
- RESTful
- JSON
- Versioniert: `/api/v1/`
- Fehler: `{ "error": "...", "code": "..." }`

---

*Erstellt: 2026-04-23*
*Autor: Rook (Agent) + Marcus (Human)*
*Status: In Planung*

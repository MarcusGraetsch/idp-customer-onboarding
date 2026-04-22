# Platform API

IDP Self-Service Platform API — Backend für Cluster-Management, Tickets und Approvals.

## Stack

- **Node.js** (Pure HTTP, keine external dependencies — läuft überall)
- **PostgreSQL** (Schema: `platform.clusters`, `platform.tickets`, `platform.approvals`)
- **Kubernetes** (Deployment + ConfigMap + Service + Ingress)

## Quick Start

### Lokal (ohne K8s)

```bash
# PostgreSQL credentials
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=platform
export PGUSER=platform-admin
export PGPASSWORD=plat0form-dev-2026!

node src/index.js
```

### In Kubernetes

```bash
# Namespace erstellen
kubectl create namespace platform-dev

# PostgreSQL installieren
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgresql bitnami/postgresql -n platform-dev \
  --set persistence.size=1Gi \
  --set auth.database=platform \
  --set auth.username=platform-admin \
  --set auth.password=plat0form-dev-2026!

# Schema erstellen (SQL weiter unten)
kubectl exec -n platform-dev postgresql-0 -- bash -c \
  "PGPASSWORD=plat0form-dev-2026! psql -U platform-admin -d platform -f /tmp/init.sql"

# API deployen
kubectl apply -f k8s/deployment.yaml
```

## API Endpoints

| Method | Endpoint | Beschreibung |
|--------|----------|---------------|
| `GET` | `/health` | Health Check |
| `POST` | `/api/clusters` | Cluster erstellen |
| `GET` | `/api/clusters` | Alle Cluster (non-deleted) |
| `GET` | `/api/clusters/:id` | Cluster Details |
| `PUT` | `/api/clusters/:id/scale` | Nodes skalieren |
| `DELETE` | `/api/clusters/:id` | Cluster löschen (soft delete) |
| `POST` | `/api/tickets` | Ticket erstellen |
| `GET` | `/api/tickets` | Alle Tickets |
| `GET` | `/api/tickets/:id` | Ticket Details |
| `POST` | `/api/approvals` | Approval anfragen |
| `GET` | `/api/approvals` | Alle Approvals |
| `PUT` | `/api/approvals/:id` | Approval approve/reject |
| `GET` | `/api/addons` | Verfügbare Add-ons |
| `GET` | `/api/regions` | Verfügbare Regionen |

## Datenbank Schema

```sql
CREATE SCHEMA IF NOT EXISTS platform;

CREATE TABLE platform.clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    customer_type VARCHAR(50) NOT NULL CHECK (customer_type IN ('internal-dev', 'external-customer')),
    provider VARCHAR(50) NOT NULL DEFAULT 'kind',
    size VARCHAR(20) NOT NULL CHECK (size IN ('small', 'medium', 'large')),
    region VARCHAR(100) DEFAULT 'local',
    addons TEXT[] DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'provisioning' CHECK (status IN ('provisioning', 'running', 'scaling', 'error', 'deleted')),
    nodes INTEGER DEFAULT 1,
    environment VARCHAR(20) DEFAULT 'dev' CHECK (environment IN ('dev', 'prod')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE platform.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('incident', 'problem', 'request', 'question')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'reopened')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    subject VARCHAR(500) NOT NULL,
    description TEXT,
    assigned_to VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    sla_deadline TIMESTAMP
);

CREATE TABLE platform.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('cluster_create', 'quota_increase', 'region_enable', 'platform_update')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requester VARCHAR(255) NOT NULL,
    approver VARCHAR(255),
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE INDEX idx_clusters_owner ON platform.clusters(owner);
CREATE INDEX idx_clusters_status ON platform.clusters(status);
CREATE INDEX idx_tickets_status ON platform.tickets(status);
CREATE INDEX idx_tickets_customer ON platform.tickets(customer_id);
```

## Configuration

| Variable | Default | Beschreibung |
|----------|---------|-------------|
| `PGHOST` | `postgresql.platform-dev.svc.cluster.local` | PostgreSQL Host |
| `PGPORT` | `5432` | PostgreSQL Port |
| `PGDATABASE` | `platform` | Datenbank Name |
| `PGUSER` | `platform-admin` | PostgreSQL User |
| `PGPASSWORD` | (required) | PostgreSQL Password |

## Deployment Methods

### Methode 1: ConfigMap (Schnell, für Entwicklung)

Aktuell genutzt in `platform-dev` — API Code liegt in ConfigMap, kein Docker Build nötig.

```bash
kubectl apply -f k8s/deployment.yaml
```

### Methode 2: Docker Image (Produktion)

```bash
# Bauen
docker build -t ghcr.io/marcusgraetsch/platform-api:latest platform-api/

# Push (braucht GitHub Container Registry access)
docker push ghcr.io/marcusgraetsch/platform-api:latest

# Deploy mit Docker image
kubectl set image deployment/platform-api -n platform-dev platform-api=ghcr.io/marcusgraetsch/platform-api:latest
```

## Access von ausserhalb

```bash
# Port-forward für lokales Testen
kubectl port-forward -n platform-dev svc/platform-api 3000:80

# API dann erreichbar unter:
curl http://localhost:3000/health
```

## Credentials

- **PostgreSQL:** `platform-admin / plat0form-dev-2026!`
- **Namespace:** `platform-dev`
- **Ingress:** `api.platform-dev.idp.local` (von VM aus über `localhost` via Ingress)

---

*Letzte Änderung: 2026-04-22*
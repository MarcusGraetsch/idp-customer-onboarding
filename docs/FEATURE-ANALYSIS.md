# IDP Feature-Analyse — Was fehlt?

> Recherche-Basis: internaldeveloperplatform.org, platformengineering.org, Backstage.io
> Stand: 2026-04-23

---

## Fünf Ebenen einer Enterprise IDP

### 1. Developer Control Plane 🚧

| Feature | Status | Kommentar |
|---------|--------|-----------|
| **Developer Portal / UI** | ❌ Nicht vorhanden | Nur API, kein Frontend |
| **Service Catalog** | ❌ Nicht vorhanden | Was läuft wo? Wer ist Owner? |
| **Software Templates** | ❌ Nicht vorhanden | "Neues Projekt" Wizard mit Boilerplate |
| **Self-Service Workflows** | 🚧 Teilweise | Tenant erstellen geht, aber nicht vollständig |
| **CLI Tool** | ❌ Nicht vorhanden | Developer CLI für schnelle Aktionen |
| **API für Agents** | 🚧 Basis | CRUD da, aber kein Event Stream |

### 2. Integration and Delivery Plane 🚧

| Feature | Status | Kommentar |
|---------|--------|-----------|
| **CI/CD Integration** | ❌ Nicht vorhanden | GitHub Actions/GitLab CI als Service |
| **Image Registry** | ❌ Nicht vorhanden | Harbor oder ghcr.io Integration |
| **GitOps (als Service)** | ❌ Nicht vorhanden | Flux/ArgoCD sind installiert, aber nicht als Self-Service |
| **Environment Management** | ❌ Nicht vorhanden | Dev → Staging → Production Workflows |
| **Build Pipelines** | ❌ Nicht vorhanden | Container Builds für Kunden |

### 3. Resource Plane 🚧

| Feature | Status | Kommentar |
|---------|--------|-----------|
| **K8s Namespaces** | ✅ Basis | Erstellung funktioniert |
| **Database Provisioning** | ❌ Nicht vorhanden | PostgreSQL, Redis, MySQL on-demand |
| **Storage Management** | ❌ Nicht vorhanden | PVCs, Backups |
| **Ingress/DNS** | ❌ Nicht vorhanden | Automatische Subdomains |
| **Resource Quotas** | 🚧 Im Schema | In DB definiert, aber nicht enforced |

### 4. Monitoring and Logging Plane ❌

| Feature | Status | Kommentar |
|---------|--------|-----------|
| **Metrics (Prometheus)** | ❌ Nicht integriert | Ist installiert, aber nicht als Service |
| **Logs (Loki/Grafana)** | ❌ Nicht integriert | Kunde sieht keine eigenen Logs |
| **Alerts** | ❌ Nicht vorhanden | Tenant-spezifische Alerts |
| **Cost Tracking / Showback** | ❌ Nicht vorhanden | Wer verbraucht was? |
| **SLA Dashboard** | ❌ Nicht vorhanden | Verfügbarkeit pro Tenant |

### 5. Security Plane 🚧

| Feature | Status | Kommentar |
|---------|--------|-----------|
| **SSO (Keycloak)** | 🚧 Installiert | Nicht mit API verbunden |
| **RBAC** | 🚧 Teilweise | Keine rollenbasierte Zugriffskontrolle in API |
| **Secret Management** | ❌ Nicht vorhanden | Vault, Sealed Secrets, oder SOPS |
| **Policy Enforcement** | 🚧 Installiert | OPA Gatekeeper da, aber nicht als Service |
| **Network Policies** | ❌ Nicht vorhanden | Tenant-Isolation auf Netzwerk-Ebene |
| **Audit Log** | 🚧 Basis | Tabelle existiert, aber nicht gefüllt |

---

## Agent-Native Features ❌

| Feature | Status | Kommentar |
|---------|--------|-----------|
| **Event Stream** | ❌ Nicht vorhanden | WebSocket / SSE für Real-Time |
| **Webhook System** | ❌ Nicht vorhanden | Callbacks bei Events |
| **Async Job Queue** | ❌ Nicht vorhanden | Langlaufende Operationen |
| **Agent Auth (mTLS/API Keys)** | ❌ Nicht vorhanden | Sichere Agent-Kommunikation |
| **Agent SDK** | ❌ Nicht vorhanden | Go/Python SDK für Agent-Entwickler |

---

## Backstage-Features (zum Vergleich) ❌

| Feature | Status | Kommentar |
|---------|--------|-----------|
| **Software Catalog** | ❌ Nicht vorhanden | Übersicht aller Services |
| **TechDocs** | ❌ Nicht vorhanden | Dokumentation im Portal |
| **Plugins** | ❌ Nicht vorhanden | Erweiterbarkeit |
| **Search** | ❌ Nicht vorhanden | Über alle Ressourcen |
| **Scaffolder** | ❌ Nicht vorhanden | Projekt-Templates |

---

## Unsere Stärken ✅

1. **K8s-Native** — Go + client-go, direkte Cluster-Integration
2. **Agent-First Architektur** — API ist primär, UI sekundär (anders als Backstage)
3. **Multi-Tenant von Anfang an** — Tenant-Isolation im Design
4. **GitOps-Integration** — Flux/ArgoCD sind schon im Cluster
5. **Security-Tools** — Keycloak, OPA, Trivy bereits installiert

---

## Unsere Schwächen ❌

1. **Kein UI** — Nur API, nichts für Menschen
2. **Keine Self-Service Workflows** — Kunde kann nichts selbst machen
3. **Keine Ressourcen-Provisierung** — Keine DBs, Storage, DNS on-demand
4. **Kein Monitoring für Kunden** — Prometheus ist da, aber nicht exposed
5. **Kein Secret Management** — Credentials hartkodiert oder manuell
6. **Keine Umgebungen** — Kein Dev/Staging/Prod Konzept

---

## Empfohlene Priorisierung

### Phase 0: Foundation (Jetzt — 2 Wochen)
- [ ] API mit Keycloak verbinden (Auth)
- [ ] Audit Log füllen
- [ ] Health Checks / Readiness Probes
- [ ] API Dokumentation (OpenAPI/Swagger)

### Phase 1: Self-Service MVP (2-4 Wochen)
- [ ] Next.js Portal (Login, Dashboard, Tenant-Liste)
- [ ] "Neues Projekt" Wizard
- [ ] Basic GitOps Integration (ArgoCD App erstellen)
- [ ] Resource Quotas enforced

### Phase 2: Ressourcen (4-6 Wochen)
- [ ] Database Provisioning (PostgreSQL, Redis)
- [ ] Ingress/DNS automatisch
- [ ] Secret Management (Vault oder Sealed Secrets)
- [ ] Environment Management (Dev/Staging/Prod)

### Phase 3: Observability (2-4 Wochen)
- [ ] Tenant-spezifisches Grafana
- [ ] Log-Aggregation (Loki)
- [ ] Cost Tracking
- [ ] Alerts

### Phase 4: Agent-Native (Laufend)
- [ ] Event Stream (WebSocket)
- [ ] Webhook System
- [ ] Async Jobs
- [ ] Agent SDK

---

## Fazit

**Wir haben ~10% einer vollständigen IDP.** Das ist OK für einen MVP, aber für einen Kunden brauchen wir mindestens Phase 1 + 2.

**Die große Frage:** Wollen wir Backstage als Basis nehmen (mehr Features out-of-the-box, aber nicht Agent-Native) oder unser eigenes Ding bauen (mehr Arbeit, aber exakt unser Use Case)?

---

*Erstellt: 2026-04-23*
*Quellen: internaldeveloperplatform.org, platformengineering.org, backstage.io*

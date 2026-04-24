# IDP Projekt — Offene Fragen & Aufgaben

> Stand: 2026-04-21

---

## 🎯 Vision: Customer Onboarding Scenario

**Ausgangssituation:**
> Kunde ruft Platform Betreiber an: "Ich möchte unser Fachverfahren in der Cloud hosten."
> Platform Betreiber: "Ok, wir senden Euch unsere Leitplanken zu."

**Was der Kunde braucht:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kunden-Reise                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Leitplanken erhalten (dieses Dokument)                        │
│         │                                                        │
│         ▼                                                        │
│  2. Template Infrastructure as Code erhalten                    │
│         │                                                        │
│         ▼                                                        │
│  3. Developer Account (Keycloak)                               │
│         │                                                        │
│         ▼                                                        │
│  4. Self-Service Deployment (GitOps)                             │
│         │                                                        │
│         ▼                                                        │
│  5. Monitoring & Feedback (Dashboards, Logs)                     │
│         │                                                        │
│         ▼                                                        │
│  6. Laufender Betrieb                                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ❓ Offene Fragen zum Customer Onboarding

### 1. Template Infrastructure as Code

**Frage:** Wo liegen die Templates die der Kunde per `git clone` bekommt?

**Antwort (aktuell):**
```
Kunde bekommt Zugang zu:
  └── <kunde>-infrastructure-repo (GitHub/GitLab)
      ├── apps/
      │   └── <fachverfahren>/
      │       ├── deployment.yaml
      │       ├── service.yaml
      │       └── kustomization.yaml
      ├── infra/
      │   ├── namespace.yaml
      │   ├── rbac.yaml
      │   └── network-policy.yaml
      └── docs/
          └── README.md
```

**Noch zu klären:**
- [ ] Ein Repo pro Kunde oder ein Multi-Tenant Repo?
- [ ] Wer erstellt das Repo (Platform Team)?
- [ ] Welche CI/CD Templates werden bereitgestellt?

### 2. Was macht der Kunde mit dem Template?

**Ablauf:**
```
Kunde cloned sein Infrastructure Repo
        │
        ▼
Entwickelt seine App (Dockerfile, Helm Chart)
        │
        ▼
Ändert Deployment.yaml falls nötig
        │
        ▼
Git push → Flux deployed automatisch
        │
        ▼
OPA Gatekeeper prüft (Leitplanken)
        │
        ▼
Wenn OK → Deployment läuft
Wenn nicht OK → Developer bekommt Feedback
```

**Noch zu klären:**
- [ ] Müssen Developer Dockerfile selbst schreiben?
- [ ] Gibt es Boilerplate Helm Charts?
- [ ] Wie werden Credentials (DB, APIs) eingetragen?

### 3. Feedback & Sichtbarkeit für Kunden

**Frage:** Wie sieht der Kunde seine Logs, Metriken, Scan-Ergebnisse?

**Antwort (aktuell):**
| Tool | Kunde sieht | Wo |
|------|-------------|-----|
| **ArgoCD** | Deployment Status | ArgoCD UI (nur eigene NS) |
| **Logs** | Eigene App Logs | Grafana (nur eigene NS) |
| **Metriken** | Eigene App Metriken | Grafana (nur eigene NS) |
| **Trivy** | ❌ Nichts | — |
| **Polaris** | ❌ Nichts | — |
| **kube-bench** | ❌ Nichts | — |

**Noch zu klären:**
- [ ] Bekommt der Kunde Zugang zu Grafana?
- [ ] Sieht er nur seine Namespaces?
- [ ] Was passiert mit CVE-Ergebnissen? (Kunde will wahrscheinlich nichts sehen)

### 4. Shared Responsibilities

```
┌─────────────────────────────────────────────────────────────────┐
│              Platform Team              │        Kunde            │
├────────────────────────────────────────┼─────────────────────────┤
│                                         │                        │
│  ✅ Kubernetes Cluster                  │                        │
│  ✅ Networking (VPC, DNS)             │                        │
│  ✅ Ingress Controller                 │                        │
│  ✅ Service Mesh (optional)            │                        │
│  ✅ OPA Gatekeeper Policies            │                        │
│  ✅ Trivy Scans (ergebnisse intern)   │                        │
│  ✅ ArgoCD Installation                │                        │
│  ✅ Keycloak                          │                        │
│                                         │                        │
├────────────────────────────────────────┼─────────────────────────┤
│                                         │                        │
│  ✅ Namespace bereitstellen            │                        │
│  ✅ RBAC für Kunden-Team              │                        │
│                                         │  ✅ Code schreiben     │
│                                         │  ✅ Dockerfile         │
│                                         │  ✅ Helm Chart        │
│                                         │  ✅ Deployment.yaml    │
│                                         │                        │
│                                         │  ✅ Git push          │
│                                         │                        │
│                                         │  ✅ Logs lesen        │
│                                         │  ✅ Metriken sehen    │
│                                         │                        │
└─────────────────────────────────────────┴─────────────────────────┘
```

### 5. Was sieht der Kunde im Detail?

**Bei einem neuen Deployment:**

```
Kunde pushed Code
        │
        ▼
GitHub Actions CI/CD Pipeline läuft
        │
        ├──► Build Docker Image
        ├──► Trivy Scan (intern, Kunde sieht nichts)
        │
        ▼ (wenn Scan OK)
Flux synced zum Cluster
        │
        ▼
OPA Gatekeeper prüft
        │
        ▼
Wenn OK → Deployment läuft
        │
        ▼
Kunde sieht in ArgoCD:
  ✅ App läuft
  ✅ Replicas
  ✅ Status

Kunde sieht in Grafana:
  ✅ CPU/Memory
  ✅ Requests
  ✅ Logs
```

**Bei CVE Fund:**
```
Kunde pushed Code
        │
        ▼
CI/CD Pipeline: Trivy findet CVE
        │
        ▼
Pipeline BLOCKIERT (CRITICALs)
        │
        ▼
Developer bekommt Feedback:
  "Build failed: Image has 16 CRITICAL CVEs"
        │
        ▼
Developer muss neues Base Image nutzen
        │
        ▼
Retry → Pipeline läuft weiter
```

---

## 📋 Aufgaben / TODOs

### Phase 1: Customer Self-Service (Sofort)

- [x] ~~**Repo-Template erstellen**~~ — Repo-Template in `template/` erstellt ✅

- [ ] **Onboarding-Dokument** — Schritt-für-Schritt für Kunden
  - Wie cloned man das Repo?
  - Wie passt man es an?
  - Wie pushet man?
  - Was passiert danach?

- [ ] **Namespace-Isolation prüfen** — Kunde sieht nur eigene Resources
  - RBAC: Nur eigener Namespace
  - Grafana: Nur eigener Namespace
  - Logs: Nur eigener Namespace

### Phase 2: Automatisierte Scan-Ergebnisse

- [ ] **Trivy Results als Datei/DB** — Scan-Ergebnisse werden gespeichert
  - Trivy Reports → JSON in S3/MinIO/Local File
  - CronJob: Trivy scan → Ergebnis speichern
  - Dashboard: JSON lesen und anzeigen

- [ ] **Dashboard Widget: Vulnerabilities**
  - Image Name
  - Critical/High/Medium Zähler
  - Problem (z.B. "Veraltet")
  - Zuständig (Platform/Developer)
  - Behebung (Link zu Docs)

- [ ] **Polaris Dashboard für Kunden**
  - Kunde soll eigene Polaris-Ergebnisse sehen können
  - Nur eigene Namespaces

### Phase 3: Multi-Platform Support

- [ ] **Rancher Integration planen**
  - Was ändert sich bei Rancher?
  - Kann Flux weiter genutzt werden?
  - Rancher vs. Vanilla K8s Unterschiede?

- [ ] **OpenShift Integration planen**
  - OpenShift spezifische Policies (SecurityContextConstraints)
  - Operator Lifecycle Manager (OLM) vs. Helm
  - ImageStreams vs. Container Registry

- [ ] **Tanzu TKGI Integration planen**
  - VMware Tanzu spezifika
  - NSX-T Networking
  - TAS (Tanzu Application Service)

### Phase 4: Dokumentation & Compliance

- [ ] **Shared Responsibility Matrix** — Dokument für Kunden
  - Was macht Platform Team?
  - Was macht Kunde?
  - Wo ist die Grenze?

- [ ] **SLA-Dokument** — Service Level Agreement
  - Verfügbarkeit
  - Support-Zeiten
  - Reaktionszeiten
  - Eskalationspfad

- [ ] **Data Processing Agreement (DPA)** — DSGVO
  - Wo liegen Kundendaten?
  - Wer hat Zugriff?
  - Löschfristen

---

## 🔧 Technische Aufgaben

### Dashboard (rook-dashboard)

- [ ] **Vulnerability Widget**
  - Liest Trivy JSON Reports
  - Zeigt aktive Vulnerabilities
  - Link zu Behebung

- [ ] **Deployment Status Widget**
  - Zeigt letzte Deployments
  - ArgoCD Sync Status
  - Flux Reconciliation Status

- [ ] **Team-spezifische Filter**
  - Kunde sieht nur eigene Daten
  - RBAC für Dashboard

### CI/CD

- [ ] **Customer Template Pipeline**
  - GitHub Actions Template für Kunden
  - Trivy Scan integriert
  - Automatischer Deployment Trigger

- [ ] **Multi-Stage Pipeline**
  - Dev → Staging → Production
  - Gates zwischen Stages

### Logging & Monitoring

- [ ] **Customer-spezifische Dashboards**
  - Loki/Promtail für Logs
  - Grafana Dashboards pro Namespace
  - Vordefinierte Alerts

---

## 📊 Priorisierung

| Priorität | Aufgabe | Aufwand | Wert |
|-----------|---------|---------|------|
| 🔴 HOCH | Repo-Template erstellen | Mittel | Kunde kann direkt starten |
| 🔴 HOCH | Namespace-Isolation für Kunden | Niedrig | Security |
| 🔴 HOCH | Onboarding-Dokument | Niedrig | Kunde weiß was zu tun |
| 🟡 MITTEL | Vulnerability Widget im Dashboard | Mittel | Automatisierung |
| 🟡 MITTEL | Trivy Results als JSON speichern | Mittel | Dashboard-Futter |
| 🟢 NIEDRIG | Rancher/OpenShift/TKGI Plan | Hoch | Langfristig |
| 🟢 NIEDRIG | SLA/DPA Dokumente | Mittel | Compliance |

---

## 📁 Benötigte Dokumente

1. **Onboarding Guide** (für Kunden)
2. **Leitplanken** (docs/21-leitplanken.md) ✅
3. **Shared Responsibility Matrix**
4. **SLA Dokument**
5. **DPA (Data Processing Agreement)**

---

*Erstellt: 2026-04-21*
*Letzte Änderung: Kommentare als GitHub Issue*

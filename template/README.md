# IDP Customer Infrastructure Template

> Dieses Repo erhält ihr als Kunde von uns. Es enthält alles nötige um euer Fachverfahren auf unserer Plattform zu deployen.

## Schnellstart

```bash
# 1. Clone dieses Repo
git clone https://github.com/<org>/<kunde>-infrastructure.git
cd <kunde>-infrastructure

# 2. Anpassen
#    - Ersetzt "beispiel" durch euren App-Namen in kustomization.yaml
#    - Passt die Helm Values in deployment.yaml an

# 3. Deployen
#    Nach einem git push wird Flux eure App automatisch deployen.
```

## Struktur

```
.
├── apps/
│   └── <app-name>/              # Eure App
│       ├── deployment.yaml       # Kubernetes Deployment
│       ├── service.yaml          # Kubernetes Service
│       ├── kustomization.yaml   # Kustomize Config
│       └── Dockerfile            # Bauplan für euer Container Image
├── infra/
│   ├── namespace.yaml           # Euer Namespace
│   ├── rbac.yaml                # Rechte für euer Team
│   └── network-policy.yaml      # Netzwerk-Regeln
├── scripts/
│   └── deploy.sh                # Hilfs-Script zum Deployen
├── docs/
│   └── README.md                # Dieser Guide
├── kustomization.yaml          # Root Kustomize
└── README.md                    # Dieser Guide
```

## Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Deployment Pipeline                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Developer pusht Code nach GitHub                            │
│          │                                                        │
│          ▼                                                        │
│  2. GitHub Actions CI/CD startet                               │
│          │                                                        │
│          ├──► Build Docker Image                                │
│          ├──► Trivy Security Scan (intern)                       │
│          │                                                        │
│          ▼                                                        │
│  3. Wenn Scan OK: Image wird gepusht                           │
│          │                                                        │
│          ▼                                                        │
│  4. Flux synced zum Cluster                                     │
│          │                                                        │
│          ├──► OPA Gatekeeper prüft Leitplanken                  │
│          │                                                        │
│          ▼                                                        │
│  5. Deployment läuft wenn alles OK                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Leitplanken

Eure App **muss** folgende Leitplanken einhalten:

| Regel | Beschreibung |
|-------|---------------|
| Kein privileged Container | Containers dürfen nicht als root laufen |
| Resource Limits | CPU und Memory Limits müssen gesetzt sein |
| Keine default Service Accounts | `default` Service Account darf nicht genutzt werden |
| Network Policy | Egress nur zu erlaubten Zielen |
| Security Context | `runAsNonRoot: true`, `readOnlyRootFilesystem: true` |

## Support

Bei Fragen: 📧 support@idp-platform.example.com

---

*Template Version: 1.0.0 | Stand: 2026-04-24*

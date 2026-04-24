# Customer Onboarding Guide

## Willkommen bei der IDP Plattform

Dieses Dokument erklärt, wie ihr euer Fachverfahren auf unserer Plattform deployt.

---

## Schritt 1: Repository verstehen

```
template/
├── apps/              # Eure Applikation
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── Dockerfile
│   └── kustomization.yaml
├── infra/             # Infrastruktur (Namespace, RBAC, Netzwerk)
│   ├── namespace.yaml
│   ├── rbac.yaml
│   └── network-policy.yaml
└── scripts/           # Hilfs-Scripts
```

---

## Schritt 2: Anpassen

### 2.1 Euren App-Namen setzen

In `kustomization.yaml` (root):
```yaml
resources:
  - ./infra/namespace.yaml
  - ./infra/rbac.yaml
  - ./infra/network-policy.yaml
  - ./apps/EURER-APP-NAME/deployment.yaml  # <- Hier anpassen
```

### 2.2 Namespace anpassen

In `infra/namespace.yaml`:
```yaml
metadata:
  name: EURER-KUNDE-name  # <- Hier anpassen (z.B. acme-prod)
  labels:
    idp-platform.io/tenant: EURER-KUNDE-name
```

### 2.3 Dockerfile anpassen

Passt das Dockerfile an eure Sprache/Framework an:

**Node.js:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci --only=production && npm run build
CMD ["node", "dist/index.js"]
```

**Python:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

**Go:**
```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o main .
FROM alpine:latest
COPY --from=builder /app/main /main
CMD ["/main"]
```

---

## Schritt 3: Bauen und Testen

### Lokal bauen:
```bash
docker build -t beispiel:latest ./apps/example-app
docker run -p 3000:3000 beispiel:latest
```

### Lokal mit Kubernetes testen:
```bash
kubectl apply -k apps/example-app --dry-run=server
```

---

## Schritt 4: Git push = Deploy

Sobald ihr auf `main` pusht:

1. **GitHub Actions** startet automatisch
2. **Docker Image** wird gebaut und nach GHCR gepusht
3. **Trivy** scannt das Image (intern)
4. **Flux** synced die manifests zum Cluster
5. **OPA Gatekeeper** prüft die Leitplanken
6. Wenn alles OK → Deployment läuft ✅

---

## Leitplanken (müssen eingehalten werden)

| Regel | Pflicht | Beschreibung |
|-------|---------|-------------|
| runAsNonRoot | ✅ Ja | Container darf nicht als root laufen |
| readOnlyRootFilesystem | ✅ Ja | Root-Dateisystem nur lesbar |
| Resource Limits | ✅ Ja | CPU und Memory Limits müssen gesetzt sein |
| Liveness Probe | ✅ Ja | Health Check für Container |
| Readiness Probe | ✅ Ja | Traffic Routing erst wenn ready |
| Kein default SA | ✅ Ja | Eigener Service Account |

---

## Nach dem Deploy

### Status prüfen:
```bash
kubectl get pods -n EURER-KUNDE-name
kubectl get deploy -n EURER-KUNDE-name
```

### Logs lesen:
```bash
kubectl logs -n EURER-KUNDE-name -l app.kubernetes.io/name=beispiel
```

### ArgoCD UI:
```
https://argocd.idp-platform.example.com
```
Ihr seht nur euren eigenen Namespace.

---

## Hilfe

**Fragen zum Deployment:**
📧 support@idp-platform.example.com

**Dokumentation:**
- Leitplanken: `docs/leitplanken.md`
- GitHub Actions Workflows: `.github/workflows/`

---

*Stand: 2026-04-24*

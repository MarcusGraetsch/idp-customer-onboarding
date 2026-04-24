# Namespace Isolation — RBAC für Kunden

## Überblick

Jeder Kunde erhält einen **isolierten Namespace** auf der Plattform. Er sieht nur seine eigenen Resources.

```
┌──────────────────────────────────────────────────────────┐
│                    IDP Platform Cluster                  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    │
│  │   kunde-a   │   │   kunde-b   │   │   kunde-c   │    │
│  │   (NS)      │   │   (NS)      │   │   (NS)      │    │
│  └─────────────┘   └─────────────┘   └─────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐     │
│  │              Plattform Namespaces               │     │
│  │  (kube-system, monitoring, ingress-nginx, etc.) │     │
│  └─────────────────────────────────────────────────┘     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Was Kunden sehen dürfen

| Resource | Erlaubt | Nur eigener NS |
|----------|---------|----------------|
| pods | ✅ Ja | ✅ Ja |
| services | ✅ Ja | ✅ Ja |
| deployments | ✅ Ja | ✅ Ja |
| configmaps | ✅ Ja | ✅ Ja |
| secrets | ❌ Nein | ❌ Nein |
| events | ✅ Ja | ✅ Ja |
| nodes | ❌ Nein | — |
| pvcs (andere NS) | ❌ Nein | — |

## Wie Isolation funktioniert

### 1. ServiceAccount pro Kunde

Jeder Kunde bekommt einen eigenen ServiceAccount in seinem Namespace:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: kunde-app
  namespace: kunde-beispiel
```

### 2. Role mit minimalen Rechten

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: kunde-developer
  namespace: kunde-beispiel
rules:
  # Darf eigene App lesen
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets"]
    verbs: ["get", "list", "watch"]
  # Darf Services lesen
  - apiGroups: [""]
    resources: ["services", "configmaps"]
    verbs: ["get", "list", "watch"]
  # Darf eigene Pods lesen (Logs)
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list"]
```

### 3. RoleBinding für User/Gruppen

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: kunde-developer-binding
  namespace: kunde-beispiel
subjects:
  - kind: User
    name: developer@kunde.example.com
  - kind: Group
    name: kunde-developers
roleRef:
  kind: Role
  name: kunde-developer
```

## Kubernetes RBAC im Template

Das Template enthält bereits RBAC-Files in `infra/rbac.yaml`.

## ArgoCD UI Isolation

ArgoCD zeigt nur Applications aus dem eigenen Namespace:

```bash
# ArgoCD filtert automatisch nach Namespace
argocd app list --namespace kunde-beispiel
```

## Grafana Dashboard Isolation

Grafana Dashboards sind pro Namespace gefiltert:

```
# PromQL Query für eigenen Namespace
{namespace="kunde-beispiel"}
```

## Was NICHT isoliert ist

| Resource | Warum nicht | Wer hat Zugriff |
|----------|------------|-----------------|
| ClusterNodes | Platform Ressource | Nur Platform Team |
| IngressClasses | Cluster-weit | Nur Platform Team |
| StorageClasses | Cluster-weit | Read-only für Kunden |
| CRDs | Cluster-weit | Nur Platform Team |

## Security Best Practices

### 1. Keine wildcard Rechte

❌ **FALSCH:**
```yaml
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]
```

✅ **RICHTIG:**
```yaml
rules:
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "watch"]
```

### 2. Keine default ServiceAccounts

```yaml
# Automatisch deaktivieren
automountServiceAccountToken: false
```

### 3. Network Policies

Jeder Namespace hat eine NetworkPolicy (siehe `infra/network-policy.yaml`).

## Testen der Isolation

```bash
# 1. Prüfen ob User nur eigenen NS sieht
kubectl auth can-i get pods --namespace=kunde-beispiel --as=developer@kunde.example.com

# 2. Prüfen ob User keinen anderen NS sieht
kubectl auth can-i get pods --namespace=anderer-kunde --as=developer@kunde.example.com

# 3. Als User in anderem NS versuchen
kubectl get pods -n anderer-kunde --as=developer@kunde.example.com
# Erwartet: "pods is forbidden: User ... cannot list resource..."
```

---

*Stand: 2026-04-24*

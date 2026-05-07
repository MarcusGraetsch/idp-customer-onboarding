# Migration to Kubernetes

## Positioning

The current Docker Compose deployment is Phase 1. It exists to get n8n running quickly on the VM beside OpenClaw while preserving a clean migration path into the Kubernetes-based IDP platform.

It is not the final target architecture.

## Target Shape

The later platform deployment should move from local Compose to one of:

- a Helm chart
- a Kustomize base plus environment overlays

## Mapping Phase 1 to Kubernetes

### Compose Services

- `n8n` container -> Kubernetes `Deployment`
- `postgres` container -> either:
  - a PostgreSQL Helm release in-cluster
  - a managed PostgreSQL service

### Local Volumes

- `./.n8n` -> PVC mounted to the n8n pod
- `./postgres-data` -> PVC for PostgreSQL if running in-cluster
- `./workflows` -> git-managed examples, not a runtime PVC requirement

### Reverse Proxy

- VM reverse proxy -> Kubernetes `Ingress`
- Hostname remains `n8n.working-notes.org`
- TLS can be handled by cert-manager, ingress controller certificates, or an upstream edge

### Secrets

- `.env` -> Kubernetes `Secret`
- Prefer Sealed Secrets, External Secrets Operator, or another GitOps-compatible secret mechanism

## PostgreSQL Options

### Option A: In-Cluster PostgreSQL

Use a chart such as Bitnami PostgreSQL for a self-contained platform deployment. This is simpler early on but increases operational state inside the cluster.

### Option B: Managed PostgreSQL

Use a managed service once the platform matures. This reduces stateful workload handling inside the cluster and usually improves backup and HA options.

## Ingress Requirements

Future ingress should preserve:

- `n8n.working-notes.org`
- HTTPS only
- websocket compatibility
- request body sizes suitable for webhook payloads

## Network Policies

When moved into Kubernetes, restrict:

- ingress to the n8n pod from the ingress controller only
- egress from n8n to required destinations only
- database access to the n8n namespace or selected pods only

## GitOps Model

Recommended later delivery:

- Store manifests or Helm values in the platform repo
- Deploy with ArgoCD or Flux
- Keep workflow examples in git for repeatable imports
- Treat the OpenClaw integration contract as a versioned API surface

## Suggested Future Layout

```text
infra/
  n8n/
    chart/ or kustomize/
    values/
    workflows/
    docs/
```

## Migration Sequence

1. Freeze the Compose environment variable model and contract fields.
2. Create Kubernetes manifests or a Helm chart using the same variable names where practical.
3. Move secrets into Sealed Secrets or External Secrets.
4. Provision PostgreSQL in-cluster or externally.
5. Add ingress for `n8n.working-notes.org`.
6. Restore workflows from export.
7. Cut traffic over after functional verification.

## Risks During Migration

- n8n version drift between the Compose and Kubernetes deployments
- broken webhook URLs after hostname or path changes
- credential re-entry requirements if encryption-key handling is inconsistent
- workflow imports that depend on environment names not carried over

# n8n Architecture

## Purpose

`infra/n8n` introduces n8n as the first automation layer beside the current OpenClaw runtime. The module is intentionally isolated so it can be operated on the VM now and lifted later into the Kubernetes-based IDP platform with minimal redesign.

## Phase 1 Runtime Shape

```text
Cloudflare DNS (manual)
        |
        v
Reverse proxy on VM (Nginx/Caddy/other)
        |
        v
127.0.0.1:5678 -> n8n container
        |
        +--> PostgreSQL container
        |
        +--> OpenClaw host endpoints via host.docker.internal
```

## Main Components

- `docker-compose.yml`
  Runs `n8n` plus a dedicated `postgres` service with persistent storage.
- `.env.example`
  Documents all required runtime variables without committing secrets.
- `workflows/examples/`
  Stores versionable workflow exports or pseudo-exports for repeatable imports.
- `scripts/`
  Provides the minimum operator tooling for backup, restore, import, and export.
- `docs/`
  Captures the Phase 1 architecture, security rules, integration contract, and Kubernetes migration path.

## Design Choices

### Dedicated PostgreSQL

n8n is configured for PostgreSQL instead of SQLite so the state model matches the later Kubernetes target and avoids a migration from local file storage.

### Local Persistent Paths

Phase 1 uses bind mounts:

- `./postgres-data`
- `./.n8n`
- `./workflows`

This keeps the VM deployment simple and auditable. The same data boundaries later map cleanly to PVCs and secrets.

### Host Reachability for OpenClaw

`host.docker.internal:host-gateway` is added so containerized n8n workflows can call an OpenClaw API or webhook listener exposed on the VM host without requiring a second Compose stack merge.

### Contract-First Integration

The durable asset here is not just a running n8n instance. It is the integration contract in [openclaw-integration-contract.md](openclaw-integration-contract.md), which should remain stable even when the transport moves from VM Docker to Kubernetes services.

## Coupling and Risk Areas

- Reverse-proxy assumptions are external to this repo and must be kept explicit.
- n8n editor auth and webhook auth are separate concerns and must not be conflated.
- If OpenClaw endpoints change without preserving the JSON contract, existing workflows will drift.
- Workflow exports can become brittle across n8n versions, so the examples are intentionally small and normalized.

## Migration Boundary

Phase 1 should be treated as a standalone infrastructure module, not as the final deployment topology. The compose file is an operational bootstrap. The future source of truth should become Kubernetes manifests or a Helm chart, with the same environment model and the same OpenClaw payload contract.

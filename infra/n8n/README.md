# n8n Phase 1 Deployment

This module adds a production-minded but minimal n8n deployment beside the current OpenClaw runtime. It is intended to run on the VM today via Docker Compose and to migrate later into the Kubernetes/GitOps IDP platform.

## Scope

Implemented now:

- Docker Compose deployment for `n8n` and `postgres`
- Persistent local storage for database and n8n state
- Environment-driven configuration for the future public URL `https://n8n.working-notes.org`
- UI basic auth baseline
- Example reverse-proxy config
- Example OpenClaw integration workflows
- Backup, restore, import, and export scripts
- Integration, security, architecture, and migration docs

Placeholders by design:

- Real Cloudflare DNS changes
- Production secret distribution
- Kubernetes manifests or Helm chart
- Outbound social publishing credentials

## Prerequisites

- Docker Engine
- Docker Compose support via either `docker compose` or `docker-compose`
- A reverse proxy on the VM that can terminate HTTPS for `n8n.working-notes.org`
- Cloudflare DNS `A` or `CNAME` record pointing `n8n.working-notes.org` to the VM IP
- Access to OpenClaw from the host if workflows should call local endpoints

Current VM note:

- Docker Compose v2 was installed during validation on this VM. If the host changes later, recheck that `docker compose version` works before using this module.

## First-Time Setup

```bash
cd infra/n8n
cp .env.example .env
chmod 600 .env
mkdir -p .n8n postgres-data backups
chmod 700 .n8n postgres-data backups
chown -R 1000:1000 .n8n
```

Edit `.env` and set at minimum:

- `N8N_BASIC_AUTH_USER`
- `N8N_BASIC_AUTH_PASSWORD`
- `N8N_ENCRYPTION_KEY`
- `POSTGRES_PASSWORD`
- `OPENCLAW_WEBHOOK_SECRET`
- `N8N_HOST`
- `N8N_PROTOCOL`
- `WEBHOOK_URL`
- `OPENCLAW_DEFAULT_BOARD_ID`

If the VM should run n8n under a different UID/GID mapping, adjust `N8N_UID` and `N8N_GID` in `.env` and make the `.n8n` directory match that ownership.

## DNS and Reverse Proxy

Marcus will configure Cloudflare DNS manually. After the DNS record exists, install or adapt the example reverse proxy from [reverse-proxy.example](reverse-proxy.example) so HTTPS traffic reaches the local n8n port.

For the initial Let's Encrypt HTTP challenge, keep the Cloudflare record on `DNS only` unless you intentionally use a DNS-01 validation flow with a Cloudflare API token. If the record stays proxied too early, certificate issuance may fail with ACME challenge `404` responses.

If the hostname is routed through an existing Cloudflare Tunnel instead of directly to the VM, prefer adding `n8n.working-notes.org` to the tunnel ingress configuration and let Cloudflare terminate HTTPS at the edge. In that setup, local `certbot --nginx` is not the primary path.

Current internal target:

- n8n container: `127.0.0.1:${N8N_PORT:-5678}` on the VM

## Start and Stop

```bash
cd infra/n8n
docker compose up -d
docker compose ps
docker compose logs -f n8n
```

Stop:

```bash
docker compose down
```

Stop without deleting data:

```bash
docker compose stop
```

## Verify n8n Is Running

Local health check:

```bash
curl -fsS http://127.0.0.1:5678/healthz
```

After DNS and reverse proxy are active:

```bash
curl -I https://n8n.working-notes.org
```

Browser check:

- Open `https://n8n.working-notes.org`
- Confirm the basic-auth prompt appears
- Confirm the n8n editor loads after login

## Import Example Workflows

Bring the stack up first, then import all example workflows:

```bash
cd infra/n8n
./scripts/import-workflows.sh
```

Export them later:

```bash
./scripts/export-workflows.sh
```

## Test a Webhook with curl

Example for the OpenClaw-to-social-draft placeholder flow:

```bash
curl -X POST \
  https://n8n.working-notes.org/webhook/openclaw/social-draft \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Event: task.social_draft.requested" \
  -d '{
    "task_id": "task-123",
    "title": "Draft release note post",
    "channel": "linkedin",
    "summary": "Summarize the merged feature set for a public audience."
  }'
```

## Operational Notes

- Keep `.env`, `.n8n/`, `postgres-data/`, and `backups/` off git.
- The n8n editor is protected by basic auth, but webhook security is separate. See [docs/security.md](docs/security.md).
- Workflows mount into `/workflows` so imports and exports remain easy to audit in git.
- `OPENCLAW_BASE_URL` defaults to `http://host.docker.internal:3001` to support a VM-hosted OpenClaw API from inside the container network.
- The first production-minded GitHub workflow now targets the live OpenClaw kanban API at `/api/kanban/tasks` and defaults to the `Rook System` board Intake column via `OPENCLAW_DEFAULT_BOARD_ID`.

## Next Steps

1. Implement or confirm the receiving OpenClaw task endpoint described in [docs/openclaw-integration-contract.md](docs/openclaw-integration-contract.md).
2. Install the reverse proxy entry for `n8n.working-notes.org`.
3. Create the first real credential set and rotate placeholder secrets.
4. Decide whether the later Kubernetes migration should use a managed PostgreSQL or an in-cluster chart.

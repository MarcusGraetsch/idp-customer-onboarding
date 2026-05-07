# Security Baseline

## Why This Matters

n8n is an automation control plane. If exposed without authentication, an attacker can inspect workflows, steal credentials stored in n8n, and execute arbitrary outbound automation. Treat it as a sensitive operations surface.

## Required Secrets

Set these in `infra/n8n/.env` and never commit the file:

- `N8N_BASIC_AUTH_USER`
- `N8N_BASIC_AUTH_PASSWORD`
- `N8N_ENCRYPTION_KEY`
- `POSTGRES_PASSWORD`
- `OPENCLAW_WEBHOOK_SECRET`
- `N8N_HOST`
- `N8N_PROTOCOL`
- `WEBHOOK_URL`

Recommendations:

- `N8N_BASIC_AUTH_PASSWORD`: long random password, not reused anywhere else
- `N8N_ENCRYPTION_KEY`: at least 32 random characters, generated once and kept stable
- `POSTGRES_PASSWORD`: unique password not shared with other services
- `OPENCLAW_WEBHOOK_SECRET`: a dedicated secret for signing or authorizing OpenClaw-bound requests

## File Permissions

Recommended local permissions:

```bash
chmod 600 infra/n8n/.env
chmod 700 infra/n8n/.n8n
chmod 700 infra/n8n/postgres-data
chmod 700 infra/n8n/backups
chown -R 1000:1000 infra/n8n/.n8n
```

Only the VM operator account that runs `docker compose` should be able to read the secrets file.
The `.n8n` directory must also be writable by the UID/GID configured for the n8n container, which defaults to `1000:1000` in this module.

## UI Auth vs Webhook Auth

These are different controls:

- UI auth protects the n8n editor and admin surface for human operators.
- Webhook auth protects machine-to-machine triggers hitting specific workflows.

Basic auth for the UI does not secure public webhook endpoints. Each public workflow trigger needs its own authentication or signature verification.

## Webhook Authentication Strategy

Baseline recommendation:

- For inbound requests to OpenClaw from n8n:
  - Use `Authorization: Bearer <token>` or HMAC signing.
  - Include `X-Idempotency-Key` per event.
- For inbound requests to n8n from OpenClaw or external systems:
  - Prefer dedicated secret headers or HMAC signatures.
  - Reject unsigned or stale requests.

Suggested headers:

- `Authorization: Bearer <token>` for simple trusted integrations
- `X-OpenClaw-Signature: sha256=<hex>` for HMAC signatures
- `X-Idempotency-Key: <uuid-or-stable-event-id>`
- `X-Request-Timestamp: <unix-seconds-or-rfc3339>`

## Firewall and Exposure Assumptions

Minimum baseline:

- Only the reverse proxy should expose the n8n editor externally.
- PostgreSQL must remain private to the Docker network.
- The n8n container should not be bound directly to a public interface without proxy controls.
- SSH access to the VM should already be restricted separately.

If the reverse proxy is bypassed, the editor would still have basic auth, but direct exposure increases attack surface and operational ambiguity. Keep one explicit ingress path.

## Secret Rotation

### `OPENCLAW_WEBHOOK_SECRET`

1. Generate a new secret.
2. Update `.env`.
3. Update OpenClaw or upstream senders to sign with the new secret.
4. Restart n8n.
5. Retire the old secret after dependent senders are confirmed.

### `N8N_BASIC_AUTH_PASSWORD`

1. Change `.env`.
2. Restart n8n.
3. Confirm the editor login works.

### `N8N_ENCRYPTION_KEY`

Do not rotate casually. This key protects stored credentials and other encrypted values in n8n. Rotating it without a migration plan can make existing stored credentials unreadable.

## Minimal Permission Principle

For the future OpenClaw/n8n integration:

- n8n should call only the narrowest OpenClaw endpoints required.
- OpenClaw should create or update only the workflows it owns.
- GitHub, calendar, and social connectors should use separate credentials where possible.
- Avoid one shared “platform super-token” spanning all automations.

## Operational Notes

- Keep execution logs only as long as needed.
- Avoid putting secrets into workflow payloads or notes fields.
- Prefer environment variables and credential stores over inline tokens inside exported JSON.

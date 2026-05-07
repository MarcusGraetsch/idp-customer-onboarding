# n8n Telegram Bot Activation Review

Date: 2026-05-07

## Scope

Activate the dedicated n8n Telegram automation bot, verify webhook delivery, and validate the `Telegram intake -> OpenClaw kanban task` workflow against the live VM deployment.

## Findings

- The dedicated Telegram automation bot token is configured locally in `infra/n8n/.env`.
- Telegram webhook registration is working and points to:
  - `https://n8n.working-notes.org/webhook/telegram/intake`
- The intake workflow is active in n8n.
- The workflow initially failed because n8n blocked `$env` access inside nodes.
- After enabling node env access, the workflow advanced past auth and parsing and then failed on the OpenClaw API call.
- Root cause for the remaining failure:
  - `rook-dashboard` listens only on `127.0.0.1:3001`
  - the n8n container cannot reach that loopback-bound API from its container network
  - direct container access to host gateway addresses such as `172.17.0.1` times out on this VM
- The public dashboard URL is protected by Cloudflare Access and cannot be used as a machine-to-machine fallback without additional service-token work.

## Actions Taken

### Repo changes

- Fixed the Telegram intake workflow export to use `responseMode: onReceived` and removed unused `Respond to Webhook` nodes.
- Added `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` to the Compose module and docs because the Phase 1 workflows intentionally use environment-driven routing and webhook verification.
- Added README and security notes documenting the node env access tradeoff and the loopback-only OpenClaw API caveat.

### Host/runtime changes

- Added the dedicated Telegram automation bot token and webhook secret to the local n8n `.env`.
- Registered the Telegram webhook with the Bot API.
- Restarted the n8n stack and confirmed the Telegram workflows reactivate.
- Added an internal Nginx bridge listener:
  - `172.17.0.1:13001 -> 127.0.0.1:3001`
- Added a narrow UFW allow rule for:
  - `docker0 -> 172.17.0.1:13001/tcp`

## Validation

Validated successfully:

- `n8n` UI remains reachable at `https://n8n.working-notes.org`
- Telegram webhook registration returns `ok=true`
- `phase1TelegramIntake` is active in `workflow_entity`
- Execution errors moved from immediate `$env` denial to downstream OpenClaw connectivity

Validated failure state:

- n8n execution data shows `Create OpenClaw Task` failing with timeout against the OpenClaw API path
- direct connectivity tests from inside the n8n container to host gateway addresses still time out
- the public dashboard API path returns a Cloudflare Access login redirect

## Open Risks

- Telegram intake is not yet end-to-end operational because the container cannot currently reach the local OpenClaw API surface.
- The local runtime `.env` still contains shell-expression style placeholder values for some secrets created in an earlier phase; they work as literal values but should be normalized carefully in a later maintenance pass.
- `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` is acceptable for this operator-owned Phase 1 deployment, but it should be revisited once credentials are moved into a tighter secret model.

## Next Steps

1. Expose a machine-consumable OpenClaw API surface that the n8n container can actually reach.
2. Preferred options:
   - provide a non-loopback internal API listener specifically for container clients
   - or introduce a Cloudflare Access service token path for the dashboard API
3. After the API path exists, rerun the Telegram intake webhook test and confirm task creation in `Rook System -> Intake`.
4. Then verify the bot from real Telegram chat messages, not only local webhook simulation.

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
- Root cause was the listener scope:
  - `rook-dashboard` listened only on `127.0.0.1:3001`
  - the n8n container could not reach that loopback-bound API from its container network
  - the correct container-reachable host gateway for this stack is the `n8n_n8n-internal` bridge gateway `172.19.0.1`
- After moving `rook-dashboard` to `172.19.0.1:3001` and pointing n8n at that listener, the Telegram intake flow reached OpenClaw successfully.
- A second workflow issue remained after the network fix:
  - the Telegram ack node used `$json.chat_id` after the OpenClaw task creation step
  - the task-creation response did not include `chat_id`
  - the ack node needed to read `chat_id` from `Parse Telegram Intake` instead
- The public dashboard URL is protected by Cloudflare Access and is still not a machine-to-machine fallback without additional service-token work.

## Actions Taken

### Repo changes

- Fixed the Telegram intake workflow export to use `responseMode: onReceived` and removed unused `Respond to Webhook` nodes.
- Added `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` to the Compose module and docs because the Phase 1 workflows intentionally use environment-driven routing and webhook verification.
- Added README and security notes documenting the node env access tradeoff and the loopback-only OpenClaw API caveat.

### Host/runtime changes

- Added the dedicated Telegram automation bot token and webhook secret to the local n8n `.env`.
- Registered the Telegram webhook with the Bot API.
- Restarted the n8n stack and confirmed the Telegram workflows reactivate.
- Updated the `rook-dashboard` systemd user service to bind its internal API listener to:
  - `172.19.0.1:3001`
- Added a narrow UFW allow rule for:
  - `br-09e44e345d02 -> 172.19.0.1:3001/tcp`
- Updated the local n8n runtime config to use:
  - `OPENCLAW_BASE_URL=http://172.19.0.1:3001`
- Re-imported and reactivated the Telegram intake workflow after fixing the ack node expression.
- Validated a successful end-to-end Telegram intake run and then archived the smoke-test tasks `ops-0050` and `ops-0051`.

## Validation

Validated successfully:

- `n8n` UI remains reachable at `https://n8n.working-notes.org`
- Telegram webhook registration returns `ok=true`
- `phase1TelegramIntake` is active in `workflow_entity`
- direct connectivity test from inside the n8n container to `http://172.19.0.1:3001/api/kanban/boards` returns `200`
- execution `7` completed with `status=success`
- the final validation run created canonical task `ops-0051` and sent the Telegram ack message successfully

Validated historical failure state:

- earlier execution data captured the original `$env` denial and the later loopback-only API timeout
- the public dashboard API path still returns a Cloudflare Access login redirect

## Open Risks

- The local runtime `.env` still contains shell-expression style placeholder values for some secrets created in an earlier phase; they work as literal values but should be normalized carefully in a later maintenance pass.
- `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` is acceptable for this operator-owned Phase 1 deployment, but it should be revisited once credentials are moved into a tighter secret model.
- The public dashboard API remains behind Cloudflare Access, so any future external machine-to-machine path still needs a dedicated service-token design if it should not rely on the internal bridge listener.

## Next Steps

1. Send a real message to `@N8NRook_bot` with `task:`, `idea:`, or `note:` and confirm the matching OpenClaw intake card appears.
2. Decide whether the internal `172.19.0.1:3001` listener should remain the permanent Phase 1 path or be replaced by a more explicit internal API surface.
3. Normalize the local `.env` secret values so they are not shell-expression placeholders.
4. If external machine clients should call the dashboard API later, design a Cloudflare Access service-token path separately from this internal bridge.

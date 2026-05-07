# Next Steps: n8n + OpenClaw

Date: 2026-05-07

## Immediate Next Steps

1. Connect the real GitHub webhook to the imported n8n workflow `GitHub PR merged -> OpenClaw kanban task`.
2. Decide the default routing policy for GitHub-originated tasks:
   - always `Rook System -> Intake`
   - or route by repository/project
3. Activate the GitHub workflow in n8n only after the webhook is configured and tested.
4. Build the second live workflow on the same bridge:
   - `Calendar event -> OpenClaw Intake`
5. Add Telegram-facing workflows for:
   - approval requests
   - daily digests
   - incident alerts
   - task intake from chat
6. Decide whether n8n should call:
   - the current live `POST /api/kanban/tasks` bridge
   - or a future stable `POST /api/tasks` abstraction
7. Add stronger auth for machine-to-machine calls:
   - webhook secret verification
   - idempotency keys
   - board-level routing guardrails
8. Export the live workflows after each meaningful change and keep them versioned in `infra/n8n/workflows/`.

## Operational Follow-Up

1. Document the final Cloudflare Tunnel path for `n8n.working-notes.org` as the primary exposure method.
2. Confirm whether Cloudflare Access should protect n8n in front of the existing n8n basic auth.
3. Decide whether Telegram should be:
   - notification-only
   - approval channel
   - full intake channel
4. Define which automations are allowed to create work automatically and which require human approval first.

## Productive First Use Cases

1. GitHub PR merged -> OpenClaw Intake
2. Calendar event -> OpenClaw Intake
3. OpenClaw task done -> Telegram summary / social draft request
4. Dispatcher failure -> Telegram alert + blocked task
5. Morning digest -> Telegram summary of:
   - intake tasks
   - blocked tasks
   - overdue items
   - recent GitHub activity

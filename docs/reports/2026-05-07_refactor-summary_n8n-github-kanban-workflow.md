# n8n GitHub to OpenClaw Kanban Workflow

Date: 2026-05-07

## Lagebild

The initial n8n scaffold is no longer limited to a placeholder `/api/tasks` contract for the GitHub merge use case. The live OpenClaw environment on the VM already exposes a writable kanban API via `rook-dashboard` at `POST /api/kanban/tasks`, and this route syncs created tasks into the canonical OpenClaw task model.

## Befunde

- A direct generic `/api/tasks` endpoint is still not the active runtime surface on the VM.
- The live `rook-dashboard` kanban API is a practical Phase 1 bridge because it:
  - creates board cards
  - syncs them into canonical tasks
  - can participate in the existing workflow-state pipeline
- The `Rook System` board already has a stable `Intake` lane that fits GitHub follow-up automation well.

## Arbeitsplan

1. Confirm the live OpenClaw write surface and payload shape.
2. Rewire the GitHub n8n workflow from the placeholder endpoint to the live kanban API.
3. Validate the live API with a smoke-test task, then remove the temporary artifact.
4. Import the updated workflow into the running n8n instance and push the repo changes.

## Umgesetzte Änderungen

- Updated `infra/n8n/docker-compose.yml`
- Updated `infra/n8n/.env.example`
- Updated `infra/n8n/README.md`
- Updated `infra/n8n/docs/openclaw-integration-contract.md`
- Updated `infra/n8n/workflows/examples/github-pr-merged-to-openclaw.json`

Runtime actions:

- Verified the live OpenClaw kanban API shape from `rook-dashboard`
- Created a temporary smoke-test task through `POST /api/kanban/tasks`
- Removed the smoke-test task again through `DELETE /api/kanban/tasks?id=...`
- Imported the updated GitHub workflow into n8n

## Validierung

- Confirmed live board IDs and the `Rook System` Intake column via `GET /api/kanban/boards`
- Confirmed successful direct task creation through the live kanban API
- Confirmed cleanup of the temporary validation task
- Confirmed the updated n8n workflow import
- Confirmed the updated workflow row exists in the n8n database as:
  - `phase1GithubPrMerged | GitHub PR merged -> OpenClaw kanban task | active=false`

## Open Risks

- The workflow is still inactive until a real GitHub webhook is connected and intentionally enabled.
- The broader stable `/api/tasks` contract is still useful as a long-term platform abstraction, but it is not yet the real runtime path on this VM.
- Repo-to-board routing is still coarse-grained; the current default goes to the `Rook System` board.

## Nächste Schritte

1. Decide whether GitHub merge events should always enter `Rook System` Intake or route by repository.
2. Add webhook authentication validation on the n8n ingress side if GitHub will post directly.
3. Activate the workflow only after the real GitHub webhook endpoint and expected board-routing policy are confirmed.
4. Build the next real workflow on top of the same live kanban bridge, likely Calendar -> OpenClaw Intake.

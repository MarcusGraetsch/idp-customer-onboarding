# OpenClaw Integration Contract

## Purpose

This document defines the initial stable JSON contract between n8n and OpenClaw. The goal is to keep workflow logic and OpenClaw orchestration decoupled enough that transports and deployment topology can change without redesigning every automation.

## Phase 1 Assumptions

- OpenClaw may expose a local HTTP API on the VM or in a nearby service.
- n8n may run beside it in Docker Compose.
- The exact receiving endpoints may not exist yet.

Current live bridge on the Marcus VM:

- `POST /api/kanban/tasks`
- implemented by the `rook-dashboard` service on port `3001`
- can create a kanban task, sync it into the canonical task model, and optionally participate in the existing workflow pipeline

TODO:

- Confirm the canonical OpenClaw task creation endpoint in the live platform.
- Confirm whether OpenClaw will accept bearer auth, HMAC signatures, or both.
- Confirm whether OpenClaw exposes workflow-management endpoints for bidirectional flow generation.

## Endpoint Assumptions

### Create task in OpenClaw

`POST /api/tasks`

### Current Phase 1 live task-creation bridge

`POST /api/kanban/tasks`

### Update task in OpenClaw

`PATCH /api/tasks/:task_id`

### Trigger agent or automation action

`POST /api/agent-tasks`

### OpenClaw requests n8n workflow execution or sync

Candidate Phase 2 endpoints:

- `POST /api/n8n/workflows`
- `PATCH /api/n8n/workflows/:workflow_id`
- `POST /api/n8n/workflows/:workflow_id/activate`

Those workflow-management endpoints are placeholders for later OpenClaw orchestration and are not implemented by this module.

## Current Phase 1 Live Payload for `POST /api/kanban/tasks`

```json
{
  "target_board_id": "995cdcf8-3eda-4bb8-8ce2-c85a10791d95",
  "target_status": "intake",
  "title": "Create follow-up draft for merged PR #123",
  "description": "Turn the merged pull request into a tracked OpenClaw task for release notes, documentation, or social draft generation.",
  "intake_brief": "Merged PR #123 requires follow-up automation.",
  "priority": "medium",
  "labels": ["automation", "github", "pull-request", "n8n"],
  "assignee": "coach",
  "project_id": "rook-workspace",
  "related_repo": "MarcusGraetsch/idp-customer-onboarding",
  "handoff_notes": "Created by n8n from a merged GitHub PR event.",
  "checklist": [
    { "title": "Review the merged PR context and decide the required follow-up artifact", "completed": false, "position": 0 },
    { "title": "Produce the requested draft, documentation, or release-note output", "completed": false, "position": 1 },
    { "title": "Record links and outcomes back into the task", "completed": false, "position": 2 }
  ]
}
```

Notes:

- `target_board_id` plus `target_status` is preferred over a raw `column_id` because it survives column ID churn better.
- For `target_status: intake`, the current OpenClaw API defaults the assignee to `coach` if none is provided.
- The response includes the kanban task row plus `sync` metadata for the canonical task.

## Required Request Headers

For n8n -> OpenClaw:

- `Content-Type: application/json`
- `User-Agent: n8n-openclaw-integration/phase1`
- `X-Idempotency-Key: <stable-event-id-or-uuid>`
- `X-Request-Timestamp: <RFC3339 timestamp>`

Authentication, choose one:

- `Authorization: Bearer <token>`
- `X-OpenClaw-Signature: sha256=<hex-hmac>`

If HMAC is used, the signature input should be:

```text
<timestamp>.<raw-request-body>
```

The secret key should be `OPENCLAW_WEBHOOK_SECRET`.

## Normalized Task Payload

```json
{
  "source": "n8n",
  "event_type": "github.pr.merged",
  "priority": "normal",
  "target_agent": "Rook",
  "title": "Create social post draft for merged PR",
  "description": "Normalize the PR merge into an OpenClaw task for follow-up automation.",
  "metadata": {
    "repository": "MarcusGraetsch/idp-customer-onboarding",
    "pr_number": 123,
    "url": "https://github.com/MarcusGraetsch/idp-customer-onboarding/pull/123",
    "merged_by": "marcus",
    "merged_at": "2026-05-07T08:00:00Z"
  }
}
```

### Field Definitions

- `source`: integration source, here typically `n8n`
- `event_type`: normalized event name such as `github.pr.merged` or `calendar.event.created`
- `priority`: `low`, `normal`, `high`, or `critical`
- `target_agent`: optional routing hint for OpenClaw
- `title`: short operator-readable task title
- `description`: detailed action request
- `metadata`: source-specific detail for debugging and downstream automation

## Idempotency

OpenClaw should treat `X-Idempotency-Key` as the deduplication key per operation. Recommended values:

- GitHub: `<delivery-id>` or `pr-<repo>-<number>-merged-<sha>`
- Calendar: `<calendar-id>-<event-id>-<updated>`
- OpenClaw-originated task events: existing task UUID plus event type

If a duplicate request is received, OpenClaw should return the existing task reference rather than creating a second task.

## Retry Behavior

n8n workflows should retry only on transient failures:

- `408`
- `409` if documented as retryable
- `425`
- `429`
- `5xx`

Avoid retries for validation failures such as:

- `400`
- `401`
- `403`
- `404`
- `422`

## Response Format

Success example:

```json
{
  "status": "accepted",
  "task_id": "task_01JTKV7D4K1F6N9Y7J8X",
  "received_at": "2026-05-07T08:00:01Z",
  "idempotency_key": "pr-idp-customer-onboarding-123-merged"
}
```

Error example:

```json
{
  "status": "error",
  "error": {
    "code": "invalid_signature",
    "message": "The request signature could not be verified."
  },
  "received_at": "2026-05-07T08:00:01Z",
  "idempotency_key": "pr-idp-customer-onboarding-123-merged"
}
```

## Error Handling Expectations

- OpenClaw should return structured JSON for all known errors.
- Signature and auth failures should be explicit.
- Validation failures should identify the missing or invalid field.
- n8n workflows should log the normalized payload, HTTP status, and response body without logging secrets.

## Logging Expectations

For every integration request, both sides should log:

- event type
- source system
- idempotency key
- timestamp
- target endpoint or workflow
- result status

Do not log:

- bearer tokens
- HMAC secrets
- raw credentials from external systems

## Example Event Mappings

- GitHub PR merged -> `github.pr.merged`
- Calendar event created or updated -> `calendar.event.created` or `calendar.event.updated`
- OpenClaw task requesting social content -> `openclaw.task.social_draft.requested`
- OpenClaw workflow sync -> `openclaw.workflow.sync.requested`

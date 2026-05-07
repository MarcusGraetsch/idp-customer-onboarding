# Using n8n in the OpenClaw System

## Purpose

In this setup, n8n should not become a second source of truth for work. The OpenClaw system already has a control-plane shape:

- `rook-dashboard` is the main human UI
- `operations/tasks/` is the durable canonical task layer
- the kanban API is the live write bridge
- Telegram is already a real human interaction channel

The best role for n8n is:

- webhook and event intake
- normalization layer
- approvals and notifications
- scheduled automation
- glue between external systems and OpenClaw

It should not replace the OpenClaw task model or the dispatcher.

## Mental Model

Think of the system like this:

```text
External events / services
  -> n8n
  -> normalize + enrich + route
  -> OpenClaw kanban / canonical task system
  -> agents / dispatcher / dashboard

OpenClaw internal events
  -> n8n
  -> notify / summarize / request approval / trigger follow-up actions
```

## Current Live Integration Surface

Today, the most practical live bridge is:

- `POST /api/kanban/tasks` on `rook-dashboard`

This is useful because it already:

- creates a task card
- places it in the target board/workflow state
- syncs to the canonical task model
- fits the current OpenClaw operational reality

## How to Use n8n via the UI

## 1. Workflow Builder

In the n8n UI, the main use is to build and maintain automation flows visually.

Typical node types for this system:

- `Webhook`
- `Schedule Trigger`
- `HTTP Request`
- `Set`
- `IF`
- `Code`
- `Telegram`
- GitHub and calendar-related nodes later where appropriate

The useful pattern is usually:

1. Receive event
2. Validate event
3. Normalize payload
4. Add metadata and routing hints
5. Send to OpenClaw
6. Optionally send a Telegram notification or approval request

## 2. Manual Operator Flows

The UI is useful when you want to:

- inspect incoming payloads
- test webhook execution manually
- replay a failed external event
- activate/deactivate automations
- edit routing logic without changing core OpenClaw code

This is especially valuable early on, while the contract is still stabilizing.

## 3. Useful UI-Driven Workflows for OpenClaw

### A. GitHub PR merged -> OpenClaw Intake

Use when:

- a merged PR should trigger release notes
- a documentation task should be created
- a social draft should be prepared
- a dashboard update or follow-up review is needed

Result:

- a normalized task lands in `Rook System -> Intake`

### B. Calendar event -> OpenClaw Intake

Use when:

- a meeting needs preparation
- follow-up notes should be created
- a research brief should exist before a call

Result:

- a calendar event becomes a real OpenClaw task

### C. OpenClaw done/blocker events -> notification

Use when:

- a task is finished
- a task is blocked
- a workflow needs human attention

Result:

- Telegram gets a compact operational message

### D. Scheduled daily or weekly digests

Use when:

- Marcus should receive a short morning summary
- the system should send a weekly operations digest

Possible digest inputs:

- intake tasks
- blocked tasks
- overdue tasks
- recent merges
- research pipeline output
- agent health warnings

## How to Use n8n with Telegram

Telegram is already a real channel in OpenClaw, not a speculative integration.

That means n8n should use Telegram in a disciplined way:

- notifications
- approvals
- light intake
- status summaries

It should not become a second full task system inside chat.

## Telegram Bot Separation

Important for this environment:

- the main OpenClaw Telegram channel already exists
- it already has its own bot/runtime behavior
- Telegram allows only one webhook/update consumer per bot stream in practice

For that reason, n8n Telegram automation should use a separate bot token such as:

- one bot for direct OpenClaw conversation
- one bot for automation intake, digests, and approvals

That avoids webhook collisions and keeps responsibilities clear.

## Good Telegram Patterns

### 1. Telegram as approval channel

Best use:

- n8n prepares a draft action
- Telegram asks Marcus for approval
- on approval, n8n continues

Examples:

- publish social post
- send newsletter
- create GitHub issue
- trigger external API side effect

This fits OpenClaw well because it keeps destructive or public actions human-gated.

### 2. Telegram as alert channel

Best use:

- task blocked
- dispatcher failure
- workflow failed repeatedly
- cron or health watchdog detected something important

Messages should be short and actionable:

- what happened
- which task/workflow is affected
- what the next action is

### 3. Telegram as digest channel

Best use:

- morning summary
- evening wrap-up
- weekly review

Examples:

- `3 new intake tasks`
- `2 blocked tasks still unresolved`
- `1 merged PR created a follow-up task`
- `research digest ready for review`

### 4. Telegram as intake channel

Possible, but should be constrained.

Good pattern:

- Marcus sends a short structured message
- n8n parses it
- creates a task in `Intake`

Examples:

- `task: prepare keynote outline`
- `idea: follow up with customer about deployment`
- `research: latest EU AI Act implementation update`

This is useful, but only if the parsing is simple and failure-safe.

## Telegram Patterns to Avoid

- Creating a second hidden task list only inside Telegram
- Letting free-form Telegram chats mutate critical workflow state without normalization
- Sending too many noisy alerts
- Triggering public or expensive actions automatically from chat text alone

## Best Concrete Workflows for This System

## 1. GitHub merge -> task + Telegram note

Flow:

1. GitHub webhook fires on merged PR
2. n8n creates an Intake task in OpenClaw
3. n8n sends Marcus a short Telegram note:
   - repo
   - PR
   - created task ID

Why this is good:

- creates durable work
- gives immediate visibility
- keeps the board as source of truth

## 2. Calendar reminder -> prep task

Flow:

1. calendar event arrives
2. n8n creates a prep task
3. optionally Telegram reminder 1 hour or 1 day before

Why this is good:

- meetings become operationally visible
- prep work is no longer hidden labor

## 3. Task done -> social draft approval

Flow:

1. OpenClaw task reaches done
2. n8n generates or routes a social draft payload
3. Telegram asks:
   - publish
   - revise
   - ignore

Why this is good:

- turns work output into publishable artifacts
- keeps human approval in the loop

## 4. Health/watchdog -> incident notification

Flow:

1. watchdog or health script emits issue
2. n8n creates a blocked/incident task
3. Telegram gets an alert

Why this is good:

- operational failures become explicit tasks
- no silent degradation

## 5. Daily executive digest

Flow:

1. n8n runs every morning
2. it queries board/task/merge/health data
3. Telegram message summarizes:
   - new intake
   - blocked items
   - due tasks
   - recent completions

Why this is good:

- creates a real control-plane rhythm
- supports Marcus without forcing dashboard-first behavior

## A Good Phase-1 Roadmap

### Phase 1

- GitHub PR merged -> OpenClaw Intake
- Calendar event -> OpenClaw Intake
- Telegram digest for task/merge summary

### Phase 2

- Telegram approvals for publication workflows
- blocked-task alerts
- dispatch/health notifications

### Phase 3

- OpenClaw-generated workflow specs -> n8n flow updates
- richer routing by project, repo, agent, or task type
- managed catalog of reusable automations

## Practical Build Recommendations

## Keep n8n small and explicit

Prefer:

- small workflows
- one clear responsibility per workflow
- explicit payload contracts

Avoid:

- giant all-in-one flows
- hidden branching logic
- lots of business rules only inside n8n

## Keep OpenClaw as the source of truth

Prefer:

- n8n creates tasks
- OpenClaw owns task lifecycle
- dashboard reflects real state

Avoid:

- storing durable business state only in n8n execution history

## Use Telegram for human-in-the-loop control

Best fit:

- approvals
- digests
- alerts
- lightweight intake

Not best fit:

- deep operational state mutation
- long-form task management

## Suggested Next Implementations

1. Activate the GitHub merge workflow after real webhook configuration.
2. Build `Calendar event -> OpenClaw Intake` on the same live kanban bridge.
3. Add a Telegram digest workflow pulling:
   - `GET /api/kanban/boards`
   - `GET /api/kanban/tasks`
   - optional OpenClaw health/runtime signals
4. Add a Telegram approval workflow for social draft or publishing actions.

## Current Telegram Workflow Pack

The current repo and n8n instance now contain three Telegram-oriented Phase 1 workflows:

- `Telegram intake -> OpenClaw kanban task`
- `Daily digest -> Telegram`
- `OpenClaw task done -> Telegram summary`

They are imported into n8n but intentionally still inactive.

## 1. Telegram intake -> OpenClaw kanban task

### What it is

A Telegram message becomes a real Intake task in OpenClaw.

### What you would do

You message the dedicated automation bot with a simple prefix such as:

- `task: write blog outline about digital labor`
- `idea: compare Discord and Telegram as command surfaces`
- `note: remember to revisit watchdog alert noise`

### What the system does

1. Telegram sends the webhook event to n8n.
2. n8n verifies:
   - the Telegram webhook secret
   - the allowed chat ID
3. n8n parses the message text.
4. n8n creates a task in the `Rook System` board with `target_status: intake`.
5. The task is mirrored into the canonical OpenClaw task model.
6. Telegram sends back an acknowledgement with the created task reference.

### Why this is useful

- fast capture from your real daily channel
- no need to open the dashboard for every idea
- the result still lands in the actual OpenClaw workflow, not in a side list

### Current limitation

This should use a separate Telegram automation bot token, not the main OpenClaw direct-chat bot.

## 2. Daily digest -> Telegram

### What it is

A scheduled summary of the current OpenClaw board state sent to Telegram.

### What the system does

1. n8n runs every morning at `08:00` Europe/Berlin.
2. It fetches board data from `GET /api/kanban/boards`.
3. It counts active tasks by board and column.
4. It sends a compact digest message to the configured Telegram chat.

### What you get

A short operational summary such as:

- how many Intake items exist
- how many Blocked items exist
- whether boards are quiet or overloaded

### Why this is useful

- gives you a morning control-plane snapshot
- makes OpenClaw visible without opening the dashboard first
- helps keep hidden work visible

### How you would use it

You do not trigger this manually most of the time. You simply receive the summary each morning in Telegram.

## 3. OpenClaw task done -> Telegram summary

### What it is

When OpenClaw finishes a task, n8n can send a short completion summary to Telegram.

### What the system does

1. OpenClaw posts a completion event to the n8n webhook.
2. n8n formats a short message:
   - task ID
   - title
   - agent
   - short summary
3. n8n sends that message to Telegram.

### Why this is useful

- completed work becomes visible immediately
- you get lightweight closure without constantly watching the board
- it is a good base for later:
  - done -> publish draft
  - done -> release note
  - done -> weekly summary

### Current limitation

This still needs a deliberate OpenClaw-side call to the n8n webhook when tasks reach `done`.

## Which of the Three Matters Most Right Now

Given your current private, non-business stage:

- `Telegram intake -> OpenClaw kanban task` is the most personally useful
- `Daily digest -> Telegram` is the most operationally stabilizing
- `OpenClaw task done -> Telegram summary` is the best visibility layer for later maturity

If you only activate one first, activate:

1. Telegram intake

If you activate two:

1. Telegram intake
2. Daily digest

## Summary

The strongest use of n8n in this environment is not “generic automation”.

It is:

- the event ingress layer
- the normalization layer
- the notification and approval layer
- the scheduled glue between external systems and OpenClaw

The dashboard, canonical tasks, and dispatcher should remain the operational center. n8n should make that system more connected, not more fragmented.

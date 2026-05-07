#!/usr/bin/env bash
set -euo pipefail

# Register the Telegram automation bot webhook for the n8n intake flow.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${MODULE_DIR}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy .env.example to .env first." >&2
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

if [[ -z "${TELEGRAM_AUTOMATION_BOT_TOKEN:-}" ]]; then
  echo "TELEGRAM_AUTOMATION_BOT_TOKEN is not set in .env" >&2
  exit 1
fi

if [[ -z "${WEBHOOK_URL:-}" ]]; then
  echo "WEBHOOK_URL is not set in .env" >&2
  exit 1
fi

if [[ -z "${TELEGRAM_WEBHOOK_SECRET:-}" ]]; then
  echo "TELEGRAM_WEBHOOK_SECRET is not set in .env" >&2
  exit 1
fi

webhook_url="${WEBHOOK_URL%/}/webhook/telegram/intake"

curl -fsS -X POST "https://api.telegram.org/bot${TELEGRAM_AUTOMATION_BOT_TOKEN}/setWebhook" \
  -d "url=${webhook_url}" \
  -d "secret_token=${TELEGRAM_WEBHOOK_SECRET}" \
  -d 'allowed_updates=["message"]'

echo
echo "Telegram webhook registered for ${webhook_url}"

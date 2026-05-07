#!/usr/bin/env bash
set -euo pipefail

# Create a timestamped backup of the n8n PostgreSQL database and local state.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${MODULE_DIR}/.env"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${MODULE_DIR}/backups/${TIMESTAMP}"
source "${SCRIPT_DIR}/lib.sh"

require_env_file "${ENV_FILE}"
COMPOSE_CMD="$(compose_cmd)"

set -a
source "${ENV_FILE}"
set +a

mkdir -p "${BACKUP_DIR}"

${COMPOSE_CMD} -f "${MODULE_DIR}/docker-compose.yml" exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-n8n}" -d "${POSTGRES_DB:-n8n}" \
  > "${BACKUP_DIR}/postgres.sql"

if [[ -d "${MODULE_DIR}/.n8n" ]]; then
  tar -C "${MODULE_DIR}" -czf "${BACKUP_DIR}/n8n-state.tar.gz" .n8n
fi

if [[ -d "${MODULE_DIR}/workflows" ]]; then
  tar -C "${MODULE_DIR}" -czf "${BACKUP_DIR}/workflows.tar.gz" workflows
fi

echo "Backup written to ${BACKUP_DIR}"

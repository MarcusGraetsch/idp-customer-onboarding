#!/usr/bin/env bash
set -euo pipefail

# Restore a backup created by backup-n8n.sh.
# Usage: ./scripts/restore-n8n.sh /absolute/or/relative/path/to/backup-dir

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${MODULE_DIR}/.env"
BACKUP_SOURCE="${1:-}"
source "${SCRIPT_DIR}/lib.sh"

if [[ -z "${BACKUP_SOURCE}" ]]; then
  echo "Usage: $0 <backup-directory>" >&2
  exit 1
fi

require_env_file "${ENV_FILE}"
COMPOSE_CMD="$(compose_cmd)"

if [[ ! -d "${BACKUP_SOURCE}" ]]; then
  echo "Backup directory not found: ${BACKUP_SOURCE}" >&2
  exit 1
fi

if [[ ! -f "${BACKUP_SOURCE}/postgres.sql" ]]; then
  echo "Expected ${BACKUP_SOURCE}/postgres.sql" >&2
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

echo "Stopping n8n before restore"
${COMPOSE_CMD} -f "${MODULE_DIR}/docker-compose.yml" stop n8n

${COMPOSE_CMD} -f "${MODULE_DIR}/docker-compose.yml" exec -T postgres \
  psql -U "${POSTGRES_USER:-n8n}" -d "${POSTGRES_DB:-n8n}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

${COMPOSE_CMD} -f "${MODULE_DIR}/docker-compose.yml" exec -T postgres \
  psql -U "${POSTGRES_USER:-n8n}" -d "${POSTGRES_DB:-n8n}" < "${BACKUP_SOURCE}/postgres.sql"

if [[ -f "${BACKUP_SOURCE}/n8n-state.tar.gz" ]]; then
  rm -rf "${MODULE_DIR}/.n8n"
  tar -C "${MODULE_DIR}" -xzf "${BACKUP_SOURCE}/n8n-state.tar.gz"
fi

if [[ -f "${BACKUP_SOURCE}/workflows.tar.gz" ]]; then
  tar -C "${MODULE_DIR}" -xzf "${BACKUP_SOURCE}/workflows.tar.gz"
fi

${COMPOSE_CMD} -f "${MODULE_DIR}/docker-compose.yml" start n8n
echo "Restore completed from ${BACKUP_SOURCE}"

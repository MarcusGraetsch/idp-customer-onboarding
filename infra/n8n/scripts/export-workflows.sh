#!/usr/bin/env bash
set -euo pipefail

# Export n8n workflows from the running container into workflows/exported.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${MODULE_DIR}/.env"
EXPORT_DIR="${MODULE_DIR}/workflows/exported"
source "${SCRIPT_DIR}/lib.sh"

require_env_file "${ENV_FILE}"
COMPOSE_CMD="$(compose_cmd)"

mkdir -p "${EXPORT_DIR}"

${COMPOSE_CMD} -f "${MODULE_DIR}/docker-compose.yml" exec -T n8n \
  n8n export:workflow --all --output=/workflows/exported

echo "Exported workflows to ${EXPORT_DIR}"

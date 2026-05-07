#!/usr/bin/env bash
set -euo pipefail

# Import workflow JSON files into the running n8n instance.
# Defaults to the example directory to keep the first run simple.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${MODULE_DIR}/.env"
IMPORT_DIR="${1:-${MODULE_DIR}/workflows/examples}"
source "${SCRIPT_DIR}/lib.sh"

require_env_file "${ENV_FILE}"
COMPOSE_CMD="$(compose_cmd)"

if [[ ! -d "${IMPORT_DIR}" ]]; then
  echo "Import directory not found: ${IMPORT_DIR}" >&2
  exit 1
fi

shopt -s nullglob
workflow_files=("${IMPORT_DIR}"/*.json)
shopt -u nullglob

if [[ "${#workflow_files[@]}" -eq 0 ]]; then
  echo "No workflow JSON files found in ${IMPORT_DIR}" >&2
  exit 1
fi

for workflow in "${workflow_files[@]}"; do
  echo "Importing ${workflow##*/}"
  ${COMPOSE_CMD} -f "${MODULE_DIR}/docker-compose.yml" exec -T n8n \
    n8n import:workflow --input="/workflows/${workflow#${MODULE_DIR}/workflows/}"
done

echo "Imported ${#workflow_files[@]} workflow(s)"

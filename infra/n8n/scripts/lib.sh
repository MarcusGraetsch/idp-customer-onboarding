#!/usr/bin/env bash
set -euo pipefail

compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    printf 'docker compose'
    return 0
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    printf 'docker-compose'
    return 0
  fi

  echo "Docker Compose is required but neither 'docker compose' nor 'docker-compose' is available." >&2
  echo "Install the Docker Compose plugin or docker-compose before running n8n operators." >&2
  return 1
}

require_env_file() {
  local env_file="$1"

  if [[ ! -f "${env_file}" ]]; then
    echo "Missing ${env_file}. Copy .env.example to .env first." >&2
    exit 1
  fi
}

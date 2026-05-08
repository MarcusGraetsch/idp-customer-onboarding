#!/bin/bash
# backup-n8n-postgres.sh — n8n Postgres DB backup
# Part of P1-R2: Postgres-Dumps fuer n8n
set -euo pipefail

BACKUP_DIR=${BACKUP_DIR:-/backups/idp/postgres}
DATE=$(date +%Y-%m-%d)
COMPOSE_DIR=${COMPOSE_DIR:-/root/.openclaw/workspace/engineering/idp-customer-onboarding/infra/n8n}

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting n8n Postgres backup..."

# Get container name
CONTAINER=$(docker ps --format '{{.Names}}' | grep n8n-postgres-1 | head -1)
if [ -z "$CONTAINER" ]; then
  echo "ERROR: n8n-postgres-1 container not found"
  exit 1
fi

# Extract credentials from docker inspect env
ENV_OUTPUT=$(docker inspect "$CONTAINER" --format '{{range .Config.Env}}{{println .}}{{end}}')

DB_USER=$(echo "$ENV_OUTPUT" | grep "^POSTGRES_USER=" | head -1 | cut -d= -f2)
DB_NAME=$(echo "$ENV_OUTPUT" | grep "^POSTGRES_DB=" | head -1 | cut -d= -f2)
DB_PASS=$(echo "$ENV_OUTPUT" | grep "^POSTGRES_PASSWORD=" | head -1 | cut -d= -f2)

if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
  echo "ERROR: Could not extract DB credentials from container"
  exit 1
fi

echo "Backing up DB: $DB_NAME (user: $DB_USER)"

# Run pg_dump inside container
docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc -f "/tmp/n8n-backup-$DATE.dump" 2>&1

# Copy to host via base64 (avoids quote issues)
docker exec "$CONTAINER" base64 "/tmp/n8n-backup-$DATE.dump" | base64 -d > "$BACKUP_DIR/n8n-postgres-$DATE.dump"

# Verify
if [ ! -s "$BACKUP_DIR/n8n-postgres-$DATE.dump" ]; then
  echo "ERROR: Backup file is empty or missing"
  exit 1
fi

# Compress
gzip -f "$BACKUP_DIR/n8n-postgres-$DATE.dump"

# Cleanup container-side
docker exec "$CONTAINER" rm -f "/tmp/n8n-backup-$DATE.dump" 2>/dev/null || true

# Sync off-site
if command -v rclone &>/dev/null && rclone listremotes 2>/dev/null | grep -q "gdrive:"; then
  echo "Syncing to Google Drive..."
  rclone copy "$BACKUP_DIR/n8n-postgres-$DATE.dump.gz" "gdrive:DigitalCapitalismBackups/rook-runtime/$HOSTNAME/postgres/" --quiet 2>&1 || echo "rclone sync failed (non-critical)"
fi

# Keep only last 14 dumps
ls -t "$BACKUP_DIR"/n8n-postgres-*.dump.gz 2>/dev/null | tail -n +15 | xargs -r rm

SIZE=$(ls -lh "$BACKUP_DIR/n8n-postgres-$DATE.dump.gz" 2>/dev/null | awk '{print $5}')
echo "[$(date)] n8n Postgres backup complete: $BACKUP_DIR/n8n-postgres-$DATE.dump.gz ($SIZE)"
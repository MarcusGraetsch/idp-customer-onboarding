#!/bin/bash
# deploy.sh — Hilfs-Script zum lokalen Deployen
# Nutzung: ./scripts/deploy.sh [namespace]

set -e

NAMESPACE="${1:-kunde-beispiel}"
KUSTOMIZE_DIR="apps/example-app"

echo "🚀 Deploye nach Namespace: ${NAMESPACE}"

# dry-run zum Prüfen
echo "📋 Dry-Run Test..."
kubectl apply -k "${KUSTOMIZE_DIR}" --dry-run=server

# Apply
echo "📦 Apply..."
kubectl apply -k "${KUSTOMIZE_DIR}"

# Status
echo "📊 Status:"
kubectl get all -n "${NAMESPACE}"

echo "✅ Deploy abgeschlossen!"

#!/usr/bin/env bash
# =============================================================================
# Rotate Container App secrets without re-running the full Bicep deployment.
#
# Usage:
#   deploy/scripts/set-secrets.sh \
#     --resource-group cs-fe-prod-rg \
#     --app cs-fe-prod-abc123 \
#     --backend-api-url https://api.payswitch.example.com
#
# Updates `backend-api-url` in place. The Container App picks up the new value
# on its next revision (no rebuild needed because the value is server-only).
# =============================================================================
set -euo pipefail

RESOURCE_GROUP=""
APP_NAME=""
BACKEND_API_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --resource-group)   RESOURCE_GROUP="$2"; shift 2 ;;
    --app)              APP_NAME="$2"; shift 2 ;;
    --backend-api-url)  BACKEND_API_URL="$2"; shift 2 ;;
    -h|--help)
      grep '^#' "$0" | head -15
      exit 0
      ;;
    *)
      echo "❌ Unknown argument: $1"
      exit 1
      ;;
  esac
done

[[ -z "$RESOURCE_GROUP" ]]  && { echo "❌ --resource-group is required"; exit 1; }
[[ -z "$APP_NAME" ]]        && { echo "❌ --app is required (Container App name)"; exit 1; }
[[ -z "$BACKEND_API_URL" ]] && { echo "❌ --backend-api-url is required"; exit 1; }

echo "▶ Updating secrets on Container App: $APP_NAME"
az containerapp secret set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --secrets "backend-api-url=${BACKEND_API_URL}" \
  --output none

# Trigger a fresh revision so the new value is picked up.
az containerapp update \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --output none

echo "✓ Secret updated. New revision is rolling out."

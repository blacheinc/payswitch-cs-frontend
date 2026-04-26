#!/usr/bin/env bash
# =============================================================================
# Rotate Container App secrets without re-running the full Bicep deployment.
#
# Usage:
#   deploy/scripts/set-secrets.sh \
#     --resource-group cs-fe-prod-rg \
#     --app cs-fe-prod-abc123 \
#     --api-url https://api.payswitch.example.com \
#     --session-secret "$(openssl rand -hex 64)"
#
# IMPORTANT: NEXT_PUBLIC_* values are inlined at `next build` time. Updating
# the Container App secret here ALONE does not change what the browser sees —
# it only updates the runtime env var. To make a new value visible to clients
# you must rebuild the image (deploy/scripts/deploy.sh) with the new --build-arg
# and roll a new revision.
#
# Use this script when you want to pre-stage a rotation in the platform secret
# store, or when only the server-readable env matters for a future change.
# =============================================================================
set -euo pipefail

RESOURCE_GROUP=""
APP_NAME=""
API_URL=""
SESSION_SECRET=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --resource-group)  RESOURCE_GROUP="$2"; shift 2 ;;
    --app)             APP_NAME="$2"; shift 2 ;;
    --api-url)         API_URL="$2"; shift 2 ;;
    --session-secret)  SESSION_SECRET="$2"; shift 2 ;;
    -h|--help)
      grep '^#' "$0" | head -25
      exit 0
      ;;
    *)
      echo "❌ Unknown argument: $1"
      exit 1
      ;;
  esac
done

[[ -z "$RESOURCE_GROUP" ]] && { echo "❌ --resource-group is required"; exit 1; }
[[ -z "$APP_NAME" ]]       && { echo "❌ --app is required (Container App name)"; exit 1; }

if [[ -z "$API_URL" && -z "$SESSION_SECRET" ]]; then
  echo "❌ Provide at least one of --api-url or --session-secret"
  exit 1
fi

UPDATE_ARGS=()
if [[ -n "$API_URL" ]]; then
  UPDATE_ARGS+=(--secrets "next-public-api-url=${API_URL}")
fi
if [[ -n "$SESSION_SECRET" ]]; then
  UPDATE_ARGS+=(--secrets "next-public-session-secret=${SESSION_SECRET}")
fi

echo "▶ Updating secrets on Container App: $APP_NAME"
az containerapp secret set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  "${UPDATE_ARGS[@]}" \
  --output none

echo "✓ Secrets updated."
echo ""
echo "⚠ Reminder: NEXT_PUBLIC_* values are baked into the client bundle at"
echo "  build time. To make these new values visible to browsers, rebuild and"
echo "  redeploy via deploy/scripts/deploy.sh."

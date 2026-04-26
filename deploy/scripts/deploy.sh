#!/usr/bin/env bash
# =============================================================================
# One-shot deploy: provision (or update) the Azure stack, build the FE image,
# push it to ACR, and roll a new revision of the Container App.
#
# Usage:
#   deploy/scripts/deploy.sh \
#     --resource-group cs-fe-prod-rg \
#     --location westeurope \
#     --environment prod \
#     --suffix abc123 \
#     --tag 1.0.0
#
# Prereqs:
#   - Azure CLI logged in to the right tenant + subscription:
#       az login
#       az account set --subscription <sub-id>
#   - Docker daemon running (for building the image locally) — or pass
#     --use-acr-build to build inside Azure Container Registry instead.
# =============================================================================
set -euo pipefail

# --- Defaults -----------------------------------------------------------------
RESOURCE_GROUP=""
LOCATION="westeurope"
ENVIRONMENT="dev"
SUFFIX=""
TAG=""
USE_ACR_BUILD="false"
PARAM_FILE=""

# --- Argument parsing ---------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --resource-group) RESOURCE_GROUP="$2"; shift 2 ;;
    --location)       LOCATION="$2"; shift 2 ;;
    --environment)    ENVIRONMENT="$2"; shift 2 ;;
    --suffix)         SUFFIX="$2"; shift 2 ;;
    --tag)            TAG="$2"; shift 2 ;;
    --use-acr-build)  USE_ACR_BUILD="true"; shift ;;
    --parameters)     PARAM_FILE="$2"; shift 2 ;;
    -h|--help)
      grep '^#' "$0" | head -30
      exit 0
      ;;
    *)
      echo "❌ Unknown argument: $1"
      exit 1
      ;;
  esac
done

# --- Validate -----------------------------------------------------------------
[[ -z "$RESOURCE_GROUP" ]] && { echo "❌ --resource-group is required"; exit 1; }
[[ -z "$SUFFIX" ]]         && { echo "❌ --suffix is required (3-8 alphanumeric chars unique to the deployment)"; exit 1; }
[[ -z "$TAG" ]]            && { echo "❌ --tag is required (e.g. '1.0.0' or '$(git rev-parse --short HEAD)')"; exit 1; }

PARAM_FILE="${PARAM_FILE:-$(dirname "$0")/../azure/parameters.${ENVIRONMENT}.json}"
[[ ! -f "$PARAM_FILE" ]] && { echo "❌ Parameters file not found: $PARAM_FILE"; exit 1; }

BICEP_FILE="$(dirname "$0")/../azure/main.bicep"

echo "▶ Resource group:    $RESOURCE_GROUP"
echo "▶ Location:          $LOCATION"
echo "▶ Environment:       $ENVIRONMENT"
echo "▶ Suffix:            $SUFFIX"
echo "▶ Image tag:         $TAG"
echo "▶ Parameters file:   $PARAM_FILE"
echo "▶ Use ACR Build:     $USE_ACR_BUILD"

# --- Step 1: ensure resource group --------------------------------------------
echo ""
echo "═══ Step 1/5: Ensure resource group ═══"
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none
echo "✓ Resource group ready."

# --- Step 2: derive ACR name + ensure registry exists -------------------------
# The Bicep template names the ACR `csfe<env><suffix>`. Mirror that here so we
# can build & push BEFORE the full Bicep deployment runs.
ACR_NAME="csfe${ENVIRONMENT}${SUFFIX}"
echo ""
echo "═══ Step 2/5: Ensure ACR '$ACR_NAME' exists ═══"
if ! az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
  echo "→ ACR not found, creating..."
  az acr create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACR_NAME" \
    --sku Basic \
    --admin-enabled false \
    --output none
fi
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer -o tsv)
echo "✓ ACR login server: $ACR_LOGIN_SERVER"

# --- Step 3: build + push the image -------------------------------------------
IMAGE_FULL="${ACR_LOGIN_SERVER}/credit-scoring-fe:${TAG}"
echo ""
echo "═══ Step 3/5: Build + push image '${IMAGE_FULL}' ═══"

# Pull the NEXT_PUBLIC_* values out of the parameters file so we can pass them
# as build args. They MUST be inlined into the bundle at build time.
NEXT_PUBLIC_API_URL=$(jq -r '.parameters.nextPublicApiUrl.value' "$PARAM_FILE")
NEXT_PUBLIC_SESSION_SECRET=$(jq -r '.parameters.nextPublicSessionSecret.value' "$PARAM_FILE")

if [[ "$NEXT_PUBLIC_SESSION_SECRET" == "REPLACE_ME"* || -z "$NEXT_PUBLIC_SESSION_SECRET" ]]; then
  echo "❌ nextPublicSessionSecret in $PARAM_FILE is still a placeholder."
  echo "   Generate one with:  openssl rand -hex 64"
  exit 1
fi

if [[ "$USE_ACR_BUILD" == "true" ]]; then
  echo "→ Building in Azure Container Registry (no local Docker needed)..."
  az acr build \
    --registry "$ACR_NAME" \
    --image "credit-scoring-fe:${TAG}" \
    --build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" \
    --build-arg "NEXT_PUBLIC_SESSION_SECRET=${NEXT_PUBLIC_SESSION_SECRET}" \
    --file Dockerfile \
    .
else
  echo "→ Building locally with docker..."
  docker build \
    --build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" \
    --build-arg "NEXT_PUBLIC_SESSION_SECRET=${NEXT_PUBLIC_SESSION_SECRET}" \
    -t "$IMAGE_FULL" \
    .

  echo "→ Logging in to ACR..."
  az acr login --name "$ACR_NAME"

  echo "→ Pushing image..."
  docker push "$IMAGE_FULL"
fi
echo "✓ Image '$IMAGE_FULL' is in the registry."

# --- Step 4: deploy the Bicep stack -------------------------------------------
echo ""
echo "═══ Step 4/5: Deploy Bicep stack ═══"
DEPLOYMENT_NAME="cs-fe-${ENVIRONMENT}-$(date +%Y%m%d%H%M%S)"

az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DEPLOYMENT_NAME" \
  --template-file "$BICEP_FILE" \
  --parameters "@$PARAM_FILE" \
  --parameters \
    resourceSuffix="$SUFFIX" \
    containerImage="$IMAGE_FULL" \
  --output none

echo "✓ Bicep deployment '$DEPLOYMENT_NAME' succeeded."

# --- Step 5: surface the public FQDN ------------------------------------------
echo ""
echo "═══ Step 5/5: Outputs ═══"
FQDN=$(az deployment group show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DEPLOYMENT_NAME" \
  --query 'properties.outputs.containerAppFqdn.value' -o tsv)

APP_NAME=$(az deployment group show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DEPLOYMENT_NAME" \
  --query 'properties.outputs.containerAppName.value' -o tsv)

echo "✓ Container App: https://${FQDN}"
echo "✓ Container App name: ${APP_NAME}"
echo ""
echo "Next:"
echo "  curl -I https://${FQDN}            # smoke check"
echo "  az containerapp logs show -n ${APP_NAME} -g ${RESOURCE_GROUP} --tail 50"

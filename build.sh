#!/usr/bin/env bash
# =============================================================================
# Game Stats UI Build & Deploy Script
# =============================================================================
# Purpose: Build Docker image, push to registry, and trigger ArgoCD deployment
# 
# Usage:
#   DEPLOY=true ./build.sh
#
# Environment Variables:
#   APP_NAME          - Application name (default: game-stats-ui)
#   NAMESPACE         - Kubernetes namespace (default: mosuon)
#   DEPLOY            - Enable deployment (default: true)
#   DEVOPS_REPO       - DevOps repository (default: Bengo-Hub/mosuon-devops-k8s)
#   DEVOPS_DIR        - Local devops directory (default: d:/Projects/BengoBox/mosuon/mosuon-devops-k8s)
# =============================================================================

set -euo pipefail
set +H

# =============================================================================
# LOGGING
# =============================================================================
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# CONFIGURATION
# =============================================================================
APP_NAME=${APP_NAME:-"game-stats-ui"}
NAMESPACE=${NAMESPACE:-"mosuon"}
DEPLOY=${DEPLOY:-true}

# Registry configuration
REGISTRY_SERVER=${REGISTRY_SERVER:-docker.io}
REGISTRY_NAMESPACE=${REGISTRY_NAMESPACE:-codevertex}
IMAGE_REPO="${REGISTRY_SERVER}/${REGISTRY_NAMESPACE}/${APP_NAME}"

# DevOps repository configuration
DEVOPS_REPO=${DEVOPS_REPO:-"Bengo-Hub/mosuon-devops-k8s"}
# Check for Windows path existence first, then fall back to a relative path
DEVOPS_DIR_WINDOWS="d:/Projects/BengoBox/mosuon/mosuon-devops-k8s"
if [[ -z "${DEVOPS_DIR:-}" ]]; then
  if [[ -d "$DEVOPS_DIR_WINDOWS" ]]; then
    DEVOPS_DIR="$DEVOPS_DIR_WINDOWS"
  else
    DEVOPS_DIR="../mosuon-devops-k8s" # Fallback to a relative path
  fi
fi
VALUES_FILE_PATH=${VALUES_FILE_PATH:-"apps/${APP_NAME}/values.yaml"}

# Standard production defaults for Next.js variables
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-"https://ultistatsapi.ultichange.org"}
NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL:-"https://ultistatsapi.ultichange.org"}
NEXT_PUBLIC_ANALYTICS_URL=${NEXT_PUBLIC_ANALYTICS_URL:-"https://analytics.ultichange.org"}

# Git configuration
GIT_EMAIL=${GIT_EMAIL:-"dev@ultistats.ultichange.org"}
GIT_USER=${GIT_USER:-"Game Stats Bot"}
TRIVY_ECODE=${TRIVY_ECODE:-0}

# Determine Git commit ID
if [[ -z ${GITHUB_SHA:-} ]]; then
  GIT_COMMIT_ID=$(git rev-parse --short=8 HEAD || echo "localbuild")
else
  GIT_COMMIT_ID=${GITHUB_SHA::8}
fi

# Handle KUBE_CONFIG fallback for B64 variant
KUBE_CONFIG=${KUBE_CONFIG:-${KUBE_CONFIG_B64:-}}

info "Service: ${APP_NAME}"
info "Namespace: ${NAMESPACE}"
info "Image: ${IMAGE_REPO}:${GIT_COMMIT_ID}"
info "API URL: ${NEXT_PUBLIC_API_URL}"

# =============================================================================
# PREREQUISITE CHECKS
# =============================================================================
for tool in git docker; do
  command -v "$tool" >/dev/null || { error "$tool is required"; exit 1; }
done
# Trivy is optional
command -v trivy >/dev/null || warn "trivy is not installed - security scan will be skipped"
if [[ ${DEPLOY} == "true" ]]; then
  for tool in kubectl helm yq; do
    command -v "$tool" >/dev/null || { error "$tool is required"; exit 1; }
  done
fi
success "Prerequisite checks passed"

# =============================================================================
# Auto-sync secrets from mosuon-devops-k8s
# =============================================================================
if [[ ${DEPLOY} == "true" ]]; then
  info "Checking and syncing required secrets from mosuon-devops-k8s..."
  SYNC_SCRIPT=$(mktemp)
  if curl -fsSL https://raw.githubusercontent.com/Bengo-Hub/mosuon-devops-k8s/master/scripts/tools/check-and-sync-secrets.sh -o "$SYNC_SCRIPT" 2>/dev/null; then
    source "$SYNC_SCRIPT"
    check_and_sync_secrets "REGISTRY_USERNAME" "REGISTRY_PASSWORD" "GIT_TOKEN" "POSTGRES_PASSWORD" "NEXT_PUBLIC_API_URL" "NEXT_PUBLIC_WS_URL" "NEXT_PUBLIC_ANALYTICS_URL" || warn "Secret sync failed - continuing with existing secrets"
    rm -f "$SYNC_SCRIPT"
  else
    warn "Unable to download secret sync script - continuing with existing secrets"
  fi
fi

# =============================================================================
# SECURITY SCAN
# =============================================================================
info "Running Trivy filesystem scan"
trivy fs . --exit-code "$TRIVY_ECODE" --format table || true

# =============================================================================
# BUILD DOCKER IMAGE
# =============================================================================
info "Building Docker image"
DOCKER_BUILDKIT=1 docker build . -t "${IMAGE_REPO}:${GIT_COMMIT_ID}" \
  --build-arg NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" \
  --build-arg NEXT_PUBLIC_WS_URL="${NEXT_PUBLIC_WS_URL}" \
  --build-arg NEXT_PUBLIC_ANALYTICS_URL="${NEXT_PUBLIC_ANALYTICS_URL}"
success "Docker build complete"

if [[ ${DEPLOY} != "true" ]]; then
  warn "DEPLOY=false -> skipping push/deploy"
  exit 0
fi

# =============================================================================
# PUSH TO REGISTRY
# =============================================================================
if [[ -n ${REGISTRY_USERNAME:-} && -n ${REGISTRY_PASSWORD:-} ]]; then
  echo "$REGISTRY_PASSWORD" | docker login "$REGISTRY_SERVER" -u "$REGISTRY_USERNAME" --password-stdin
fi

docker push "${IMAGE_REPO}:${GIT_COMMIT_ID}"
success "Image pushed to ${IMAGE_REPO}:${GIT_COMMIT_ID}"

# =============================================================================
# KUBERNETES SETUP
# =============================================================================
if [[ -n ${KUBE_CONFIG:-} ]]; then
  mkdir -p ~/.kube
  echo "$KUBE_CONFIG" | base64 -d > ~/.kube/config
  chmod 600 ~/.kube/config
  export KUBECONFIG=~/.kube/config
fi

# Create namespace if needed
kubectl get ns "$NAMESPACE" >/dev/null 2>&1 || kubectl create ns "$NAMESPACE"

# Local dev secrets (not in CI)
if [[ -z ${CI:-}${GITHUB_ACTIONS:-} && -f KubeSecrets/devENV.yml ]]; then
  info "Applying local dev secrets"
  kubectl apply -n "$NAMESPACE" -f KubeSecrets/devENV.yml || warn "Failed to apply devENV.yml"
fi

# Create registry credentials
if [[ -n ${REGISTRY_USERNAME:-} && -n ${REGISTRY_PASSWORD:-} ]]; then
  kubectl -n "$NAMESPACE" create secret docker-registry registry-credentials \
    --docker-server="$REGISTRY_SERVER" \
    --docker-username="$REGISTRY_USERNAME" \
    --docker-password="$REGISTRY_PASSWORD" \
    --dry-run=client -o yaml | kubectl apply -f - || warn "Registry secret creation failed"
fi

# =============================================================================
# CLONE DEVOPS REPO (if needed)
# =============================================================================
if [[ ! -d "$DEVOPS_DIR" ]]; then
  info "Cloning mosuon-devops-k8s repository..."
  TOKEN="${GH_PAT:-${GIT_SECRET:-${GITHUB_TOKEN:-}}}"
  CLONE_URL="https://github.com/${DEVOPS_REPO}.git"
  [[ -n $TOKEN ]] && CLONE_URL="https://x-access-token:${TOKEN}@github.com/${DEVOPS_REPO}.git"
  git clone "$CLONE_URL" "$DEVOPS_DIR" || warn "Unable to clone devops repo"
fi

# =============================================================================
# SECRETS SETUP (using centralized devops script)
# =============================================================================
if [[ -f "$DEVOPS_DIR/scripts/infrastructure/create-service-secrets.sh" ]]; then
  info "Creating secrets for UI using centralized script..."
  chmod +x "$DEVOPS_DIR/scripts/infrastructure/create-service-secrets.sh"
  
  # Delegate to the centralized secret generator
  SERVICE_NAME="$APP_NAME" \
  NAMESPACE="$NAMESPACE" \
  POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}" \
  JWT_SECRET="${JWT_SECRET:-}" \
  bash "$DEVOPS_DIR/scripts/infrastructure/create-service-secrets.sh" || warn "Secret creation failed"
else
  warn "create-service-secrets.sh not found (checked $DEVOPS_DIR/scripts/infrastructure/create-service-secrets.sh)"
fi

# =============================================================================
# UPDATE HELM VALUES (using centralized script)
# =============================================================================
if [[ -f "${DEVOPS_DIR}/scripts/tools/update-helm-values.sh" ]]; then
  info "Updating Helm values in devops repo..."
  chmod +x "${DEVOPS_DIR}/scripts/tools/update-helm-values.sh"
  
  # Delegate solely to the centralized updater tool
  "${DEVOPS_DIR}/scripts/tools/update-helm-values.sh" "$APP_NAME" "$GIT_COMMIT_ID" || warn "Helm values update failed"

  # Wait for deployment to be ready (ArgoCD will trigger the rollout)
  if [[ -n ${KUBE_CONFIG:-} || -n ${KUBECONFIG:-} ]]; then
    info "Waiting for deployment ${APP_NAME} to be ready in namespace ${NAMESPACE}..."
    info "Note: This depends on ArgoCD synchronization speed."
    kubectl -n "$NAMESPACE" rollout status deployment/"$APP_NAME" --timeout=300s || {
      error "Deployment failed to become ready within 300s. Check pod logs or ImagePullBackOff."
      exit 1
    }
    success "Deployment ${APP_NAME} is ready!"
  fi
else
  warn "update-helm-values.sh not found - manual Helm values update may be required"
fi

# =============================================================================
# SUMMARY
# =============================================================================
success "Build and deploy complete!"
echo ""
info "Deployment summary:"
echo "  Image      : ${IMAGE_REPO}:${GIT_COMMIT_ID}"
echo "  Namespace  : ${NAMESPACE}"
echo "  API URL    : ${NEXT_PUBLIC_API_URL}"
echo ""
info "ArgoCD will auto-deploy ${APP_NAME}:${GIT_COMMIT_ID} to ${NAMESPACE} namespace"

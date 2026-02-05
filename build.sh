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
#   DEVOPS_DIR        - Local devops directory (default: $HOME/mosuon-devops-k8s)
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
DEVOPS_DIR=${DEVOPS_DIR:-"$HOME/mosuon-devops-k8s"}
VALUES_FILE_PATH=${VALUES_FILE_PATH:-"apps/${APP_NAME}/values.yaml"}

# Git configuration
GIT_EMAIL=${GIT_EMAIL:-"dev@ultimatestats.co.ke"}
GIT_USER=${GIT_USER:-"Game Stats Bot"}
TRIVY_ECODE=${TRIVY_ECODE:-0}

# Build-time environment variables for Next.js
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-"https://api.ultimatestats.co.ke"}
NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL:-"wss://ultimatestats.co.ke"}
NEXT_PUBLIC_ANALYTICS_URL=${NEXT_PUBLIC_ANALYTICS_URL:-"https://analytics.ultimatestats.co.ke"}

# Determine Git commit ID
if [[ -z ${GITHUB_SHA:-} ]]; then
  GIT_COMMIT_ID=$(git rev-parse --short=8 HEAD || echo "localbuild")
else
  GIT_COMMIT_ID=${GITHUB_SHA::8}
fi

info "Service: ${APP_NAME}"
info "Namespace: ${NAMESPACE}"
info "Image: ${IMAGE_REPO}:${GIT_COMMIT_ID}"
info "API URL: ${NEXT_PUBLIC_API_URL}"

# =============================================================================
# PREREQUISITE CHECKS
# =============================================================================
for tool in git docker trivy; do
  command -v "$tool" >/dev/null || { error "$tool is required"; exit 1; }
done
if [[ ${DEPLOY} == "true" ]]; then
  for tool in kubectl helm yq; do
    command -v "$tool" >/dev/null || { error "$tool is required"; exit 1; }
  done
fi
success "Prerequisite checks passed"

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
# UPDATE HELM VALUES (using centralized script)
# =============================================================================
if [[ -f "${DEVOPS_DIR}/scripts/helm/update-values.sh" ]]; then
  info "Updating Helm values in devops repo..."
  chmod +x "${DEVOPS_DIR}/scripts/helm/update-values.sh"
  
  # Source and call the function
  source "${DEVOPS_DIR}/scripts/helm/update-values.sh" 2>/dev/null || true
  
  if declare -f update_helm_values >/dev/null 2>&1; then
    update_helm_values "$APP_NAME" "$GIT_COMMIT_ID" "$IMAGE_REPO"
    success "Helm values updated - ArgoCD will auto-sync"
  else
    # Direct script execution as fallback
    APP_NAME="$APP_NAME" \
    IMAGE_TAG="$GIT_COMMIT_ID" \
    IMAGE_REPO="$IMAGE_REPO" \
    DEVOPS_REPO="$DEVOPS_REPO" \
    DEVOPS_DIR="$DEVOPS_DIR" \
    VALUES_FILE_PATH="$VALUES_FILE_PATH" \
    GIT_EMAIL="$GIT_EMAIL" \
    GIT_USER="$GIT_USER" \
    bash "${DEVOPS_DIR}/scripts/helm/update-values.sh" --app "$APP_NAME" --tag "$GIT_COMMIT_ID" --repo "$IMAGE_REPO" || warn "Helm values update failed"
  fi
else
  warn "update-values.sh not found - manual Helm values update may be required"
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

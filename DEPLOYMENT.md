# Deployment Guide

## Overview
Game Stats is designed to be cloud-native and highly available. This document covers the deployment strategies for various environments.

---

## Containerization

### Docker
The project includes multi-stage Dockerfiles for both Backend and Frontend.

**Backend**:
```bash
docker build -t game-stats-api ./games-stats-api
```

**Frontend**:
```bash
docker build -t game-stats-ui ./game-stats-ui
```

---

## Infrastructure Requirements

### Database
- **PostgreSQL 17**: Must have `pgvector` extension enabled.
- **Redis 7.2+**: Used for caching and Pub/Sub.

### AI Engine
- **Ollama**: Requires access to models (`duckdb-nsql:7b`). For production, nodes with GPU acceleration (NVIDIA) are highly recommended.

---

## Kubernetes (Production)

Deployments are managed via Helm charts or standard manifests in `/deployments/k8s`.

### Scaling
- **API**: Scales based on CPU/Memory and active SSE connection count.
- **UI**: Scales based on request volume.

### Networking
- **Ingress**: Nginx or Traefik with TLS termination.
- **SSE**: Ensure long-lived connections are permitted and timeouts are adjusted.

---

## CI/CD Pipeline (GitHub Actions)

1. **Lint/Test**: runs on every PR.
2. **Build**: Docker images pushed to registry.
3. **Deploy (Staging)**: Automatic on merge to `main`.
4. **Deploy (Production)**: Automated after manual approval of Staging smoke tests.

---

## Monitoring
- **Prometheus**: Scrapes `/metrics` from the Go API.
- **Grafana**: Dashboards for SSE connection health and DB performance.
- **Sentry**: Frontend/Backend error tracking.

---

## Environment Variables
Refer to the respective app READMEs for a full list of required variables.
- [Backend README](./games-stats-api/README.md)
- [Frontend README](./game-stats-ui/README.md)

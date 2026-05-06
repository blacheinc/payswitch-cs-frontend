# Kubernetes + Argo CD + GitLab deployment blueprint

This document is a practical blueprint you can use in client discussions when they run Kubernetes with GitLab CI and Argo CD.

It is intentionally aligned with the current app behavior:

- Next.js standalone container on port `3000` (`Dockerfile`).
- Runtime-only server config via env vars (not baked at build).
- Sensitive config (`BACKEND_API_URL`) read server-side only.

---

## 1) Recommended deployment model

Use a GitOps flow:

1. **GitLab CI** runs validation and builds a Docker image.
2. CI pushes the image to a registry (GitLab registry, ACR, ECR, etc.).
3. CI updates Kubernetes manifests (image tag) in Git.
4. **Argo CD** watches that Git path and syncs to Kubernetes.
5. Secrets are injected at runtime from Azure Key Vault via External Secrets.

This gives:

- reproducible infra changes (everything is in Git),
- controlled promotion from dev to prod,
- no runtime secrets in repository or Docker image.

---

## 2) What is included in this repository

### Kubernetes manifests (Kustomize)

- Base: `deploy/k8s/base`
  - `deployment.yaml`, `service.yaml`, `ingress.yaml`, `hpa.yaml`, `pdb.yaml`
- Environment overlays:
  - `deploy/k8s/overlays/dev`
  - `deploy/k8s/overlays/prod`

### Argo CD applications

- `deploy/argocd/application-dev.yaml`
- `deploy/argocd/application-prod.yaml`

### GitLab CI starter template

- `deploy/gitlab/.gitlab-ci.k8s.yml`

You can either:

- include this file from your main `.gitlab-ci.yml`, or
- copy the jobs into your existing pipeline.

---

## 3) Security posture of this starter

The manifests are written with safer defaults:

- no hardcoded secrets in YAML,
- `BACKEND_API_URL` sourced from Kubernetes Secret,
- intended secret source is Azure Key Vault through `ExternalSecret`,
- non-root container runtime and dropped Linux capabilities,
- ingress TLS enabled by default.

Important assumptions to validate with the client:

- External Secrets Operator is installed,
- `ClusterSecretStore` named `azure-keyvault` exists,
- ingress class is `nginx`,
- TLS certificate secret names match their cert-manager setup.

---

## 4) Setup checklist to discuss with client platform team

1. Confirm cluster add-ons:
   - Argo CD,
   - ingress controller,
   - metrics server (for HPA),
   - External Secrets Operator.
2. Confirm secret integration:
   - Azure Key Vault access model (Workload Identity / Pod Identity),
   - key names for `BACKEND_API_URL` per environment.
3. Confirm registry access from cluster:
   - image pull secret or cloud-native workload identity.
4. Confirm network and DNS:
   - external hostname per env,
   - TLS certificate issuance path.
5. Confirm GitOps ownership model:
   - same repo or separate infra repo,
   - branch strategy (`develop` -> dev, `tag v*` -> prod).

---

## 5) Suggested environment values

- Dev:
  - namespace: `credit-scoring-dev`
  - ingress host: `fe-dev.example.com`
  - image tag pattern: `dev-<short_sha>`
- Prod:
  - namespace: `credit-scoring-prod`
  - ingress host: `fe.example.com`
  - image tag pattern: release tags (`v1.2.3` -> `1.2.3`)

---

## 6) Talking points for the call

- "The app is already runtime-configured, so we can promote one image across environments without rebuilds."
- "Secrets do not need to live in GitLab variables as plain values; we can fetch from Azure Key Vault at runtime."
- "Argo CD gives drift detection and deterministic rollbacks because desired state is in Git."
- "We can support either same-repo GitOps or split app/infra repositories, depending on your governance model."

---

## 7) Minimal first dry-run plan (no production risk)

1. Create dev namespace and apply Argo dev application only.
2. Configure one Azure Key Vault secret for dev `BACKEND_API_URL`.
3. Run GitLab pipeline on `develop` and observe:
   - image pushed,
   - `kustomization.yaml` updated,
   - Argo sync to cluster.
4. Validate:
   - app reachable on dev host,
   - login flow works through server-side `/api/*` proxy,
   - no secrets exposed in browser.
5. Repeat for prod with manual approval gate.

---

## 8) Notes about customization

Before using this as-is, update placeholders:

- `registry.example.com/credit-scoring/fe` image name,
- GitLab repo URL in Argo Application specs,
- ingress hosts and TLS secret names,
- ExternalSecret remote key names.

These templates are starter assets to accelerate client alignment and should be adapted to the target cluster standards.

# n8n Phase 1 Session Report

Date: 2026-05-07

Scope:

- Initial n8n integration module for the IDP/OpenClaw platform repo
- Phase 1 VM deployment via Docker Compose
- Security, contract, workflow, and migration scaffolding
- Live VM deployment and reverse-proxy hookup for `n8n.working-notes.org`

## Lagebild

The repository currently mixes a local Docker-based developer workflow with early Kubernetes platform artifacts. There was no dedicated infrastructure module for n8n yet, but the existing `template/infra` and `platform-api/k8s` areas make `infra/n8n` the cleanest boundary for a Phase 1 deployment that can later migrate into the platform repo’s K8s/GitOps model.

Operationally, the main risks are external to the code itself: reverse-proxy alignment, secret handling, stable integration contracts, and preserving a clean migration path so workflow logic does not need to be redesigned when Compose is replaced by Kubernetes.

## Befunde

- The repo had no secret-safe conventions beyond a minimal `.gitignore`, so the n8n module needed explicit exclusions for `.env` and local state paths.
- The current repo already acknowledges both VM-local and Kubernetes paths, which makes a contract-first n8n module preferable to a direct install script.
- Reverse proxy on the broader platform appears Nginx-oriented, so a generic VM proxy example is more consistent than assuming a fresh Caddy install.
- OpenClaw task and workflow-management endpoints are not confirmed in this repo, so the integration contract needed TODO markers and explicit placeholder assumptions.

## Arbeitsplan

1. Create `infra/n8n` with Compose, env template, scripts, example workflows, and docs.
2. Define security and OpenClaw integration boundaries before finalizing runtime defaults.
3. Validate YAML, JSON, and shell syntax, then summarize the remaining manual VM steps.

## Umgesetzte Änderungen

- Added `infra/n8n/docker-compose.yml`
- Added `infra/n8n/.env.example`
- Added `infra/n8n/README.md`
- Added `infra/n8n/reverse-proxy.example`
- Added `infra/n8n/docs/architecture.md`
- Added `infra/n8n/docs/security.md`
- Added `infra/n8n/docs/migration-to-kubernetes.md`
- Added `infra/n8n/docs/openclaw-integration-contract.md`
- Added example workflows under `infra/n8n/workflows/examples/`
- Added operator scripts under `infra/n8n/scripts/`
- Updated `.gitignore` for n8n local state and secrets

## Validierung

Planned checks for this session:

- Compose file rendering with environment defaults
- Shell syntax checks for all scripts
- JSON parsing for example workflow exports

Completed:

- Shell syntax checks for all scripts
- JSON parsing for all example workflows
- YAML parsing for `infra/n8n/docker-compose.yml`
- Live image pull and stack boot with placeholder values
- Local health check succeeded on `http://127.0.0.1:5678/healthz`
- Live deployment with generated secrets in local `.env`
- nginx host routing verified locally with `n8n.working-notes.org -> 127.0.0.1:5678`

Validation findings:

- Docker Compose support was missing initially on the VM and had to be installed as `docker-compose-v2`.
- The first live startup then exposed a real permission issue on the bind-mounted `.n8n` directory. The module was updated to run n8n as a configurable UID/GID and to document the required host-directory ownership.
- A second live startup succeeded after applying the ownership fix. The temporary placeholder `.env` and generated local state were removed afterward.
- Final live deployment was started with generated secrets and kept running.
- nginx now serves the `n8n.working-notes.org` host on port 80 and proxies correctly to the local n8n container.

Remaining external dependency:

- Public DNS for `n8n.working-notes.org` was still not resolving from the VM at deployment time, which blocks automated certificate issuance and final HTTPS activation.
- After DNS propagation reached Let's Encrypt, certificate issuance still failed through Cloudflare HTTP validation with `404`, which indicates the Cloudflare proxy/challenge path still needs adjustment. Initial issuance should use `DNS only` or a DNS-01 flow.

## Open Risks

- The exact OpenClaw receiving endpoint is still a placeholder assumption.
- Bearer-token auth is used in the example workflow as a simple baseline, but HMAC may be preferable once the OpenClaw side is implemented.
- n8n version compatibility of exported workflow JSON should be rechecked after the first real import on the VM.
- A future rebuild of the VM must ensure Docker Compose support is present before this module is used.
- HTTPS for the public URL still depends on a valid public DNS record and certificate issuance.
- If Cloudflare proxying remains enabled during initial HTTP-01 validation, Let's Encrypt may see challenge failures even though the origin is up.

## Nächste Schritte

1. Populate `infra/n8n/.env` with real secrets.
2. Confirm the Cloudflare CNAME resolves publicly to this VM.
3. Set the Cloudflare record to `DNS only` for initial issuance or switch to a DNS-01 method with API credentials.
4. Issue a certificate for `n8n.working-notes.org` and switch nginx to HTTPS.
5. Confirm or implement the OpenClaw `/api/tasks` endpoint and auth behavior.
6. Import the example workflows and run the first end-to-end webhook test.

# Clive — Suras Home Server Context

You are running inside the **Clive** AI terminal on the Suras home server.
This is an Oracle Cloud ARM64 instance (Ubuntu 22.04, 4 vCPU, 24 GB RAM, 200 GB disk).

## Your Environment

- You are the `node` user (uid 1001) inside a Docker container
- The **entire host filesystem** is mounted read-only at `/host/`
- The **Docker socket** is mounted at `/var/run/docker.sock` — you can run `docker` commands
- **SSH keys** are at `~/.ssh/` — you can SSH to other hosts
- `ANTHROPIC_API_KEY` and `GEMINI_API_KEY` are explicitly blank — CLIs use OAuth only

## Key Paths on Host (via /host/)

| Path | What it is |
|------|-----------|
| `/host/opt/stacks/core/` | Traefik, Authentik, server-dashboard compose stacks |
| `/host/opt/stacks/apps/` | All user-facing apps (open-webui, vibeterm, stirling-pdf, etc.) |
| `/host/opt/stacks/automation/` | n8n, openclaw/Inga, webhooks |
| `/host/opt/stacks/token-auditor/` | token-proxy + token-stats |
| `/host/opt/stacks/apps/homepage/` | landing-page nginx (suras.org) |
| `/host/opt/server-dashboard/` | Next.js dashboard source |
| `/host/root/.env` | Root env (use: `docker run --rm -v /root:/rootfs alpine cat /rootfs/.env`) |
| `/host/root/.openclaw/openclaw.json` | Inga gateway config + auth token |

## Rebuild Dashboard

```bash
cd /host/opt/server-dashboard
docker build -t server-dashboard:latest .
cd /host/opt/stacks/core
docker compose up -d --no-deps dashboard
```

Or use the alias: `rebuild-dashboard`

## Service Map (hostname → container)

| URL | Container | Compose file |
|-----|-----------|-------------|
| dashboard.suras.org | server-dashboard | /host/opt/stacks/core/compose.yaml |
| chat.suras.org | open-webui | /host/opt/stacks/apps/compose.yaml |
| clive.suras.org | ai-terminal (this container) | /host/opt/stacks/apps/vibeterm/compose.yaml |
| n8n.suras.org | n8n | /host/opt/stacks/automation/compose.yaml |
| auth.suras.org | authentik-server | /host/opt/stacks/core/authentik/compose.yaml |
| logs.suras.org | dozzle | /host/opt/stacks/apps/compose.yaml |
| vault.suras.org | vaultwarden | /host/opt/stacks/apps/compose.yaml |
| wiki.suras.org | apps-silverbullet | /host/opt/stacks/apps/compose.yaml |
| search.suras.org | searxng | /host/opt/stacks/apps/compose.yaml |
| budget.suras.org | actual-budget | /host/opt/stacks/apps/compose.yaml |
| pdf.suras.org | stirling-pdf | /host/opt/stacks/apps/compose.yaml |
| inga.suras.org | inga-hub (nginx redirect → Tailscale) | /host/opt/stacks/automation/openclaw/pp-workspace/inga-hub/ |
| console.suras.org | sys-console (ttyd) | /host/opt/oracle-terminal/docker-compose.yml |
| suras.org | landing-page (nginx) | /host/opt/stacks/apps/homepage/compose.yaml |

## Networking

- All containers on **socker-mesh** Docker network
- Public access: Cloudflare tunnel → Traefik (port 80) → containers
- All `*.suras.org` routes need Traefik labels on the container
- Authentik forward auth: add label `traefik.http.routers.<name>.middlewares=authentik-auth@file`
- Internal-only services use hostnames ending in `.gem.internal` or `.svc.internal`

## Inga Gateway

- Available from socker-mesh at `http://172.30.0.1:18789`
- Auth token in `/host/root/.openclaw/openclaw.json` at `.gateway.auth.token`
- OpenAI-compatible API at `/v1/chat/completions`

## Important Notes

- `/host/` is **read-only**. To write files, SSH to the host or use `docker exec`
- Root files: use `docker run --rm -v /root:/rootfs alpine ...` to read root-owned files
- The `ubuntu` user (uid 1001) owns most files; root owns `/root/`
- Always rebuild the dashboard image after editing its source files

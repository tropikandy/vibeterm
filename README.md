# Clive (vibeterm)

Mobile-first web terminal that streams a persistent tmux session to the browser over WebSockets. Designed for running Claude Code and Gemini CLI from any device, including phone.

## Architecture

```
Browser (xterm.js v5)
  └── WebSocket / HTTPS
        └── Express + ws (Node.js, port 4001)
              └── node-pty → tmux session
                    └── claude / gemini CLI
```

- **Auth**: Cloudflare tunnel → Traefik → Authentik forward-auth (SSO)
- **Transport**: WebSocket for terminal I/O, REST API for session/browse control
- **Persistence**: tmux keeps sessions alive across disconnects
- **File browser**: Reads host filesystem via BROWSE_ROOT mount

## Stack

| Layer | Tech |
|---|---|
| Terminal renderer | xterm.js v5 + WebGL addon |
| Session persistence | tmux |
| PTY | node-pty |
| Server | Express + ws |
| Auth | Authentik (Traefik forwardAuth) |
| Reverse proxy | Traefik v2 |
| CDN/tunnel | Cloudflare |

## Features

### Core
- Full terminal emulator (xterm.js, WebGL-accelerated, canvas fallback)
- Persistent tmux sessions — close the browser, session keeps running
- Attach to existing tmux sessions (Active Sessions tab)
- Scrollback buffer (50 KB, replayed on reconnect)
- File browser with breadcrumb navigation, mkdir, git clone
- Dark mode, E-ink/mono mode, font size controls

### Mobile
- Pinch-to-zoom font size
- Swipe right from left edge → detach session
- Mobile toolbar: ^C, Esc, Ctrl, Tab, arrow keys, Enter, Paste, Compose
- Compose overlay with keyboard-aware positioning
- Compose message history (up/down arrows)

### UX Polish
- Scroll-lock button: floating `↓ new output` when scrolled up
- Git status badge: branch + dirty indicator in path row
- Recent directories: last 8 paths as quick-access chips
- Auto-resume: remembers last browsed path across sessions
- Tab title shows session name (underscores → spaces, CLI suffix stripped)
- PWA theme-color syncs with light/dark theme
- Offline PWA splash (service worker caches app shell)

### Reliability
- WebSocket pong timeout: dead connections terminated after 30 s
- Soft reconnect (no page reload on reconnect)
- CSP headers on all responses

## Configuration

Environment variables (set in compose):

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Server listen port |
| `BROWSE_ROOT` | *(none)* | Clamp file browser to this path |

## API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/session` | Current session state |
| POST | `/api/session/start` | Start new session (`{cli, args, yolo, sessionName}`) |
| POST | `/api/session/detach` | Detach from tmux (session stays alive) |
| POST | `/api/session/kill` | Kill tmux session entirely |
| GET | `/api/tmux-sessions` | List existing tmux sessions |
| GET | `/api/browse?path=` | List directory contents |
| POST | `/api/mkdir` | Create directory (`{path, name}`) |
| POST | `/api/git-clone` | Clone repo (`{url, targetDir}`) |
| GET | `/api/git-status?path=` | Branch + dirty status for a path |
| POST | `/api/theme` | Sync CLI theme (`{lightMode}`) |

WebSocket: `ws://host/?_=<timestamp>` — binary PTY output, JSON control messages

## Deployment (Docker)

Source lives at `/home/ubuntu/vibeterm/`. Stack at `/opt/stacks/apps/vibeterm/compose.yaml`.

Container name: `ai-terminal`  
Image: `vibeterm-ai-terminal` (built locally — ARM64)  
Internal port: `4001`  
Public URL: `https://clive.suras.org`

**Rebuild after code changes:**
```bash
cd /opt/stacks/apps/vibeterm
sudo docker compose up -d --build
```

**Check logs:**
```bash
docker logs ai-terminal --tail 50 -f
```

**Key volumes:**
- `/home/ubuntu/.ssh` → `~/.ssh` (ro) — for SSH from terminal
- `/home/ubuntu/.claude-clive` → `~/.claude` (rw) — Claude auth persists
- `/opt/clive-config/CLAUDE.md` → `/app/CLAUDE.md` (rw) — system context
- `/:/host` (ro) — entire host filesystem readable in browser

## Local Development

```bash
# Prerequisites
sudo apt install build-essential python3 tmux
node --version  # 18+

# Install
npm install

# Run
PORT=4001 BROWSE_ROOT=/host node server.js
```

## Auth

Protected by Authentik SSO. Admin: `suras` / `aelarsson@gmail.com` at `https://auth.suras.org`.

Traefik middleware chain: `https-headers` → `authentik-forward-auth`  
Config: `/opt/stacks/core/traefik-middlewares.yaml`

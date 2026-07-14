# IterLoop API Windows shadow deployment

This deployment is intentionally independent from CLIProxyAPI, CodePrism, the old quota gateway, existing cloudflared processes, and existing SSH tunnels.

## Fixed boundaries

- Install root: `C:\IterLoopAPI`
- Application bind: `127.0.0.1:28517`
- Existing upstream remains `127.0.0.1:28317 -> ai-mac:8317`
- Scheduled tasks: `IterLoop API Shadow` and `IterLoop Tunnel Shadow`
- A new Cloudflare Tunnel UUID and credentials file are required.
- The installer does not start tasks unless `-StartTasks` is supplied.

## Layout

```text
C:\IterLoopAPI\
  app\iterloop-api.exe
  config\iterloop.env
  data\
  logs\
  scripts\
  cloudflared\cloudflared.exe
  cloudflared\config.yml
  cloudflared\<new-tunnel-uuid>.json
  tools\age.exe
  tools\rclone.exe
```

## Safe rollout

1. Install PostgreSQL 15 and create a dedicated `iterloop` database and login.
2. Download the GitHub Actions Windows artifact and verify `SHA256SUMS.txt`.
3. Place the EXE and scripts in the layout above.
4. Create `config\iterloop.env` from the example and replace every secret.
5. Create a brand-new Cloudflare Tunnel and copy its new credential JSON into the isolated directory.
6. Configure DNS for `console`, `api`, and `admin` on the new Tunnel.
7. Protect `admin.iter-loop.com` with Cloudflare Access and allow only the designated Gmail identity. Require a second factor where available.
8. Run `install-shadow.ps1` without `-StartTasks`. Inspect the two new tasks and confirm port `28517` is unused.
9. Start only `IterLoop API Shadow`, then verify `http://127.0.0.1:28517/healthz`.
10. Configure the existing CLIProxyAPI-compatible upstream as a New API channel using `http://127.0.0.1:28317` without changing that upstream process.
11. Validate Claude/Codex normal and SSE calls, key model/IP/expiry rejection, and billing before starting the new Tunnel task.
12. Start only `IterLoop Tunnel Shadow`, verify Cloudflare Access, and use test accounts before opening registration.

## Grok phase 1

- Create a dedicated type `48` xAI channel for `grok-4.5,grok-4.3` at `https://api.x.ai/v1`.
- Assign the official channel only to `grok-standard,combined-standard`, set priority `20`, and keep it disabled until a funded official xAI API key is available.
- Create a separate disabled type `58` Advanced Custom channel named `ai-mac CLIProxyAPI Grok Shadow` at `http://127.0.0.1:28317`, with only `/v1/responses` and `/v1/chat/completions` routes and group `grok-shadow`.
- Never add Grok models to the existing shared `ai-mac CLIProxyAPI` channel.
- Do not enable the OAuth Shadow until at least three accounts are active, 20 consecutive probes succeed, and no account reports `spending-limit`.
- Phase 1 exposes text, HTTP, and SSE only. WebSocket, image, video, `web_search`, and `x_search` remain disabled.

Never restart Windows, ai-mac, CLIProxyAPI, CodePrism, original cloudflared tasks, old SSH tunnels, or `quota-cpa.codeprism.tech` as part of this rollout.

## Registration settings

The environment template enables Resend SMTP, email verification, and Turnstile. Verify `iter-loop.com` in Resend and create Turnstile host rules before enabling public registration. New users start with zero quota and must redeem or receive an issuance before model calls succeed.

## Backups and retention

- Run `backup-postgres.ps1` daily with Task Scheduler.
- Keep 7 encrypted daily files and 4 encrypted Sunday files.
- Store the age private key outside the server and upload only encrypted `.age` files to R2.
- Run `run-retention.ps1` daily with `ITERLOOP_DATABASE_URL` set for `psql`.
- Test a restore into a separate PostgreSQL database before public launch.

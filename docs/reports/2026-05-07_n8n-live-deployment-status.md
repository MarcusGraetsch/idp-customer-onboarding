# n8n Live Deployment Status

Date: 2026-05-07

## Lagebild

`n8n` ist auf dem VM jetzt live deployed und lokal healthy. Die Container laufen dauerhaft, Nginx ist fuer `n8n.working-notes.org` auf Port 80 vorgeschaltet, und der Repo-Stand ist committed und nach `origin/master` gepusht in Commit `64b1fe1` (`feat: add phase-1 n8n automation module`).

Die ausfuehrliche Session-Doku liegt in [2026-05-07_session-review_n8n-phase1.md](./2026-05-07_session-review_n8n-phase1.md).

## Befunde

Die App-Seite ist nicht mehr der Blocker. `docker compose ps` zeigt beide Container healthy, und `curl http://127.0.0.1:5678/healthz` liefert `{"status":"ok"}`.

Der verbleibende externe Blocker ist Cloudflare/TLS:

- Let's Encrypt erreicht `n8n.working-notes.org`
- die ACME-HTTP-Challenge scheitert aber mit `404`
- der Response kam ueber eine Cloudflare-IP, also ist die Subdomain aktuell noch proxied
- spaeter stellte sich heraus: die Subdomain zeigt per CNAME auf einen bestehenden Cloudflare Tunnel (`*.cfargotunnel.com`) und nicht direkt auf den VPS

Damit war `certbot --nginx` nicht der richtige finale Integrationspfad. Stattdessen muss `n8n.working-notes.org` als weiterer Hostname in den bestehenden `cloudflared`-Tunnel aufgenommen werden, waehrend Cloudflare HTTPS am Edge terminiert.

## Arbeitsplan

1. In Cloudflare `n8n.working-notes.org` kurzfristig auf `DNS only` stellen.
2. Danach das TLS-Zertifikat ausstellen.
3. Anschliessend Nginx auf HTTPS umstellen.
4. Danach ist `https://n8n.working-notes.org` sauber live.

## Umgesetzte Änderungen

### Repo

- `infra/n8n/` komplett angelegt
- Compose, Scripts, Workflows, Security-/Migration-/Contract-Doku
- Report in `docs/reports/`
- `.gitignore` fuer Runtime-Daten ergaenzt

### Host / Runtime

- Docker Compose v2 installiert
- `certbot` plus nginx plugin installiert
- n8n mit echter lokaler `.env` und generierten Secrets gestartet
- Nginx-Site fuer `n8n.working-notes.org` eingerichtet und geladen

### Wichtige Host-Pfade

- n8n env: `/root/.openclaw/workspace/engineering/idp-customer-onboarding/infra/n8n/.env`
- nginx site: `/etc/nginx/sites-available/n8n-working-notes`

## Validierung

Geprueft:

- Git-Repo sauber gepusht
- `n8n` und `postgres` laufen healthy
- lokaler Healthcheck erfolgreich
- Nginx-Proxy-Routing per Hostname-Override erfolgreich
- Let's-Encrypt-Lauf tatsaechlich bis zur oeffentlichen Challenge getestet

Nicht abgeschlossen:

- oeffentliches HTTPS, weil Cloudflare die ACME-Challenge noch abfaengt bzw. falsch proxied

## Naechste Schritte

Was jetzt noetig ist:

- In Cloudflare bei `n8n.working-notes.org` den orangefarbenen Proxy deaktivieren, also `DNS only`
- danach die Zertifikatsausstellung erneut ausfuehren

Server-Kommando fuer den naechsten Schritt:

```bash
certbot certonly --nginx --non-interactive --agree-tos -m marcusgraetsch@gmail.com -d n8n.working-notes.org
```

Danach kann der finale HTTPS-Nginx-Block aktiviert werden.

Der aktuell gesetzte Basic-Auth-Benutzer ist:

- `marcus`

Das Passwort liegt nur in der lokalen `.env` und nicht in Git. Falls noetig:

```bash
grep '^N8N_BASIC_AUTH_' /root/.openclaw/workspace/engineering/idp-customer-onboarding/infra/n8n/.env
```

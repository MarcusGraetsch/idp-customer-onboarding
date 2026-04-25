# Deployment — k8portal.working-notes.org

## Voraussetzungen
- Docker + Docker Compose
- Domain DNS zeigt auf Server-IP: `k8portal.working-notes.org`

## Quick Start

```bash
# 1. Repository klonen
git clone https://github.com/MarcusGraetsch/idp-customer-onboarding.git
cd idp-customer-onboarding

# 2. Keycloak starten (Port 30081)
kubectl apply -f k8s/keycloak.yaml

# 3. Docker Compose starten
docker compose up -d

# 4. Prüfen
curl http://k8portal.working-notes.org
```

## Services

| Service | URL | Port |
|---------|-----|------|
| Portal | http://k8portal.working-notes.org | 3000 |
| API | http://k8portal.working-notes.org:8080 | 8080 |
| Keycloak | http://k8portal.working-notes.org:30081 | 30081 |

## Keycloak Realm importieren

1. Keycloak Admin: http://k8portal.working-notes.org:30081/admin
2. Realm `idp-platform` importieren ( realm.json in docs/)
3. Clients + Users prüfen

## Portal Login

1. http://k8portal.working-notes.org/login
2. "Mit Keycloak anmelden" klicken
3. Demo: `demo` / `demo123`

## Troubleshooting

```bash
# Logs anzeigen
docker compose logs -f

# Alle Container stoppen
docker compose down

# Neustart
docker compose restart
```

---

*Stand: 2026-04-25*

# IDP Platform API

## Quick Start

```bash
# 1. Abhängigkeiten installieren
cd api
go mod download

# 2. PostgreSQL starten (Docker)
docker run -d \
  --name idp-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=idp_platform \
  -p 5432:5432 \
  postgres:16-alpine

# 3. Server starten
go run cmd/server/main.go

# 4. Testen
curl http://localhost:8080/health
curl -X POST http://localhost:8080/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{"name":"test-kunde","display_name":"Test Kunde GmbH","owner_email":"test@example.com"}'
```

## Umgebungsvariablen

| Variable | Default | Beschreibung |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/idp_platform?sslmode=disable` | PostgreSQL Verbindung |
| `PORT` | `8080` | HTTP Port |
| `KUBECONFIG` | - | Pfad zu kubeconfig (leer = in-cluster) |

## API Endpoints

| Methode | Endpoint | Beschreibung |
|---------|----------|-------------|
| GET | `/health` | Health Check |
| POST | `/api/v1/tenants` | Tenant erstellen |
| GET | `/api/v1/tenants` | Alle Tenants listen |
| GET | `/api/v1/tenants/:id` | Einzelnen Tenant abrufen |
| DELETE | `/api/v1/tenants/:id` | Tenant löschen (soft) |

# IDP Platform Portal

## Next.js Frontend für die IDP Platform

## Quick Start

```bash
cd portal
npm install
npm run dev
```

## Features

- **Landing Page** — IDP Platform Vorstellung
- **Login** — JWT Auth (MVP: Mock, Produktion: Keycloak)
- **Dashboard** — Übersicht mit Stats, Quick Actions, Tenant Liste
- **Tenants** — Alle Tenants verwalten (Tabelle mit Delete)
- **Neues Projekt** — 3-Schritt Wizard für Tenant Erstellung

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- SWR (Data Fetching)
- Lucide React (Icons)

## API Proxy

Next.js leitet `/api/*` an das Go Backend weiter:
```
/api/v1/* → http://localhost:8080/api/v1/*
```

## Auth

MVP: Lokaler JWT Token im localStorage
Produktion: Keycloak OAuth2 Flow

## Umgebungsvariablen

| Variable | Default | Beschreibung |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Backend API URL |
| `NEXT_PUBLIC_KEYCLOAK_URL` | - | Keycloak URL |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | `idp-platform` | Keycloak Realm |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | `idp-portal` | Keycloak Client ID |

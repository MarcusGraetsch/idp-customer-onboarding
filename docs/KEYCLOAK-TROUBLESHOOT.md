# Keycloak Admin Login Problem — Troubleshooting Guide

**Datum:** 2026-04-24  
**Status:** PENDING — Pod läuft, Admin-Login funktioniert nicht

---

## Problem

- Keycloak 17.0.1 Pod startet erfolgreich
- `add-user-keycloak.sh` sagt "User admin hinzugefügt"
- Login mit `admin/admin123` → `invalid_grant: user_not_found`

---

## Ursache (vermutet)

Keycloak 17.x (legacy mode) bootet mit H2-DB. Die `keycloak-add-user.json` Datei wird beim Boot gelesen, ABER:
1. Die DB wird frisch erstellt wenn `keycloak.mv.db` nicht existiert
2. Der Admin-User aus `keycloak-add-user.json` sollte automatisch angelegt werden
3. Es passiert nicht — warscheinlich weil die JSON-Datei im falschen Format ist oder beim Boot nicht gelesen wird

---

## Lösungsweg (ausstehend)

### Schritt 1: Keycloak Management Port prüfen

```bash
kubectl exec -n keycloak keycloak-0 -- bash -c '
  curl -s http://127.0.0.1:9990/management
'
```

Falls Management erreichbar → jboss-cli nutzen.

### Schritt 2: Neuen Admin via Management Interface anlegen

```bash
kubectl exec -n keycloak keycloak-0 -- /opt/jboss/keycloak/bin/jboss-cli.sh \
  --connect --controller=127.0.0.1:9990 \
  --user=management-admin \
  --password=<mgmt-passwort> \
  ":reload"
```

### Schritt 3: Keycloak ENV VARs setzen (PERSISTENT)

Aktuell sind die ENV VARs für ADMIN gesetzt (KEYCLOAK_ADMIN=admin), aber der User wird nicht angelegt.

Falls Schritt 2 nicht funktioniert → Helm Chart values patchen oder Secrets nutzen.

### Schritt 4: Alternative — Keycloak komplett neu

Falls nichts funktioniert: Kind-Cluster neu erstellen mit korrekten Start-Parametern.

---

## Checkliste zum Testen

- [ ] Management Port 9990 erreichbar?
- [ ] kcadm.sh funktioniert mit /auth Endpoint?
- [ ] User in H2-DB vorhanden?
- [ ] ENV VARs korrekt beim Boot?

---

## Referenzen

- Keycloak 17 Docs: https://www.keycloak.org/docs/17.0/
- Helm Chart: `https://github.com/codecentric/helm-charts` (keycloak)
- ENV VARs: `KEYCLOAK_ADMIN`, `KEYCLOAK_ADMIN_PASSWORD`

---

*Erstellt: 2026-04-24 19:40*

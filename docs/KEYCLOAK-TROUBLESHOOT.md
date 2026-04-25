# Keycloak Admin Login Problem — Troubleshooting Guide

**Datum:** 2026-04-24, aktualisiert 2026-04-25

---

## ✅ GELÖST: Keycloak 26 (Quarkus) installiert

**Keycloak 17 (WildFly)** unterstützte die Env Vars für Admin Credentials NICHT.
**Keycloak 26 (Quarkus)** unterstützt sie — und es funktioniert!

**Setup:**
- `quay.io/keycloak/keycloak:26.0`
- Admin: `admin/admin123`
- Service: `keycloak-http` NodePort 30081
- Realm: `idp-platform` mit Clients `idp-api`, `idp-portal`

---

## Problem (Keycloak 17 — OLD)

- Keycloak 17.0.1 Pod startet erfolgreich
- `add-user-keycloak.sh` sagt "User admin hinzugefügt"
- Login mit `admin/admin123` → `invalid_grant: user_not_found`

**Ursache:** Keycloak 17 (WildFly) liest die `keycloak-add-user.json` NICHT automatisch.
Das Script erstellt eine JSON-Datei, aber sie wird beim Boot nicht verarbeitet.

---

## Lösung: Keycloak 26 (Quarkus)

```bash
# Altes Keycloak 17 deinstallieren
helm uninstall keycloak -n keycloak
kubectl delete namespace keycloak

# Keycloak 26 deployen
kubectl create namespace keycloak

kubectl apply -f - << 'EOF'
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: keycloak
  namespace: keycloak
spec:
  serviceName: keycloak
  replicas: 1
  selector:
    matchLabels:
      app: keycloak
  template:
    spec:
      containers:
        - name: keycloak
          image: quay.io/keycloak/keycloak:26.0
          args: ["start", "--http-enabled=true", "--hostname-strict=false"]
          env:
            - name: KEYCLOAK_ADMIN
              value: "admin"
            - name: KEYCLOAK_ADMIN_PASSWORD
              value: "admin123"
          ports:
            - name: http
              containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: keycloak-http
  namespace: keycloak
spec:
  type: NodePort
  selector:
    app: keycloak
  ports:
    - name: http
      port: 80
      targetPort: 8080
      nodePort: 30081
EOF

# Warten bis Ready
kubectl wait --for=condition=Ready pod/keycloak-0 -n keycloak --timeout=180s
```

**Wichtig:** Kein `/auth` Prefix in URLs bei Keycloak 26!

---

## Referenzen

- `docs/KEYCLOAK-17-VS-26.md` — Vergleich der Versionen
- Keycloak 26 Docs: https://www.keycloak.org/docs/26.0/

---

*Erstellt: 2026-04-24 | Aktualisiert: 2026-04-25 | Status: GELÖST*

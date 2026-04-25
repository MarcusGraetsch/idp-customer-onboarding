# Keycloak 17 vs. Keycloak 26 (Quarkus)

## Überblick

| Aspekt | Keycloak 17 (WildFly) | Keycloak 26 (Quarkus) |
|--------|------------------------|-----------------------|
| **Runtime** | JBoss WildFly (Java EE) | Quarkus (Superschneller Java Stack) |
| **Admin API** | `/auth/admin/...` | `/admin/...` |
| **Admin Credentials** | `add-user-keycloak.sh` Script | Env Vars `KC_BOOTSTRAP_ADMIN_USERNAME` |
| **Startup** | Langsam (~60s+) | Schnell (~10-40s) |
| **Memory** | Hoch (500MB+) | Niedrig (256MB+) |
| **Config** | `standalone.xml` | Kommandozeile + Config File |

---

## Keycloak 17 (WildFly Legacy)

```bash
# Admin User anlegen
/opt/jboss/keycloak/bin/add-user-keycloak.sh -r master -u admin -p admin123

# Admin Login
/opt/jboss/keycloak/bin/kcadm.sh config credentials \
  --server http://localhost:8080/auth \
  --realm master \
  --user admin --password admin123

# Admin API
curl http://localhost:8080/auth/admin/realms/master/users
```

**Probleme:**
- `add-user-keycloak.sh` erstellt JSON-Datei, aber Keycloak liest sie NICHT automatisch
- Keine Env Vars für Admin Credentials (erst in 20+)
- WildFly Boot-Prozess komplex und langsam
- Port-Forward: `/auth` Prefix zwingend

---

## Keycloak 26 (Quarkus)

```bash
# Admin Credentials via Env Vars
KC_BOOTSTRAP_ADMIN_USERNAME=admin
KC_BOOTSTRAP_ADMIN_PASSWORD=admin123

# Start
kc.sh start --http-enabled=true --hostname-strict=false

# Admin API (KEIN /auth Prefix!)
curl http://localhost:8080/admin/realms/master/users
```

**Vorteile:**
- Env Vars für Admin Credentials funktionieren out-of-the-box
- **KEIN** `/auth` Prefix in URLs
- Quarkus = Supersonic Subatomic Java
- Optimiert für Cloud/Kubernetes
- Health Checks standardmäßig an Bord

---

## Wichtige URL-Unterschiede

| Feature | Keycloak 17 | Keycloak 26 |
|---------|-------------|-------------|
| Token Endpoint | `.../auth/realms/master/...` | `.../realms/master/...` |
| Admin API | `.../auth/admin/...` | `.../admin/...` |
| Health Check | Custom | `/health/ready`, `/health/live` |
| Login Page | `.../auth/realms/master/login...` | `.../realms/master/login...` |

---

## Deployment für IDP (Empfohlen: Keycloak 26)

```yaml
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
          args:
            - start
            - "--http-enabled=true"
            - "--hostname-strict=false"
          env:
            - name: KEYCLOAK_ADMIN
              value: "admin"
            - name: KEYCLOAK_ADMIN_PASSWORD
              value: "admin123"
          ports:
            - name: http
              containerPort: 8080
```

---

## Upgrade-Pfade

### Von 17 auf 26

1. **Realm exportieren** (aus Keycloak 17 Admin UI)
2. **Neues Keycloak 26 deployen**
3. **Realm importieren** via Admin API
4. **Client-IDs prüfen** (manche可能在Import-Fehler)

### Import-Befehl

```bash
TOKEN=$(curl -s -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

curl -X POST "http://localhost:8080/admin/realms" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @realm-export.json
```

---

## Deprecated Warnings in Keycloak 26

```
KC-SERVICES0110: Environment variable 'KEYCLOAK_ADMIN' is deprecated,
                 use 'KC_BOOTSTRAP_ADMIN_USERNAME' instead
```

**Aktuelle Env Vars (26.0+):**
- `KC_BOOTSTRAP_ADMIN_USERNAME` statt `KEYCLOAK_ADMIN`
- `KC_BOOTSTRAP_ADMIN_PASSWORD` statt `KEYCLOAK_ADMIN_PASSWORD`

Die alten Env Vars funktionieren noch (mit Warnung), aber die neuen sind die Zukunft.

---

*Stand: 2026-04-25*

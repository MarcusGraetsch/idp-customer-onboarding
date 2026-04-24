package middleware

import (
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// JWKS repräsentiert die JSON Web Key Set von Keycloak
type JWKS struct {
	Keys []JWK `json:"keys"`
}

// JWK ist ein einzelner JSON Web Key
type JWK struct {
	Kty string `json:"kty"`
	Kid string `json:"kid"`
	Use string `json:"use"`
	N   string `json:"n"`
	E   string `json:"e"`
}

// AuthMiddleware validiert JWT Tokens von Keycloak
type AuthMiddleware struct {
	keycloakURL   string
	realm         string
	clientID      string
	publicKeys    map[string]*rsa.PublicKey
	mu            sync.RWMutex
	lastFetch     time.Time
	httpClient    *http.Client
}

// NewAuthMiddleware erstellt eine neue Auth Middleware
func NewAuthMiddleware(keycloakURL, realm, clientID string) *AuthMiddleware {
	return &AuthMiddleware{
		keycloakURL: keycloakURL,
		realm:       realm,
		clientID:    clientID,
		publicKeys:  make(map[string]*rsa.PublicKey),
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// Middleware prüft JWT Token im Authorization Header
func (a *AuthMiddleware) Middleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Wenn kein Keycloak konfiguriert, überspringe Auth (Development Mode)
		if a.keycloakURL == "" {
			c.Locals("user", "anonymous")
			c.Locals("roles", []string{"admin"}) // Admin im Dev Mode
			return c.Next()
		}

		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authorization Header fehlt",
			})
		}

		// Bearer Token extrahieren
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Ungültiger Authorization Header. Erwartet: Bearer <token>",
			})
		}

		tokenString := parts[1]

		// Token parsen und validieren
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Prüfe Algorithmus
			if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
				return nil, fmt.Errorf("unerwarteter Signatur-Algorithmus: %v", token.Header["alg"])
			}

			// Public Key für dieses Token holen
			kid, ok := token.Header["kid"].(string)
			if !ok {
				return nil, fmt.Errorf("keine kid im Token Header")
			}

			return a.getPublicKey(kid)
		})

		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Ungültiges Token: " + err.Error(),
			})
		}

		// Claims extrahieren
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Ungültige Claims",
			})
		}

		// Issuer prüfen
		expectedIssuer := fmt.Sprintf("%s/realms/%s", a.keycloakURL, a.realm)
		if iss, ok := claims["iss"].(string); ok && iss != expectedIssuer {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Falscher Issuer",
			})
		}

		// Client ID prüfen (azp oder aud)
		azp, _ := claims["azp"].(string)
		aud, _ := claims["aud"].(string)
		if a.clientID != "" && azp != a.clientID && aud != a.clientID {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Token nicht für diesen Client ausgestellt",
			})
		}

		// User ID und Email extrahieren
		sub, _ := claims["sub"].(string)
		email, _ := claims["email"].(string)
		name, _ := claims["name"].(string)
		preferredUsername, _ := claims["preferred_username"].(string)

		// Roles aus Realm Access extrahieren
		var roles []string
		if realmAccess, ok := claims["realm_access"].(map[string]interface{}); ok {
			if rolesArr, ok := realmAccess["roles"].([]interface{}); ok {
				for _, r := range rolesArr {
					if role, ok := r.(string); ok {
						roles = append(roles, role)
					}
				}
			}
		}

		// Locals setzen für Handler
		c.Locals("user_id", sub)
		c.Locals("user_email", email)
		c.Locals("user_name", name)
		c.Locals("user_username", preferredUsername)
		c.Locals("roles", roles)
		c.Locals("token", token)

		return c.Next()
	}
}

// RequireRole prüft ob der User eine bestimmte Rolle hat
func RequireRole(role string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		roles, ok := c.Locals("roles").([]string)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Keine Rollen im Token",
			})
		}

		for _, r := range roles {
			if r == role {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": fmt.Sprintf("Rolle '%s' erforderlich", role),
		})
	}
}

// getPublicKey holt oder lädt den Public Key für eine kid
func (a *AuthMiddleware) getPublicKey(kid string) (*rsa.PublicKey, error) {
	// Zuerst aus Cache
	a.mu.RLock()
	key, exists := a.publicKeys[kid]
	a.mu.RUnlock()

	if exists {
		return key, nil
	}

	// Lade von Keycloak
	if err := a.fetchKeys(); err != nil {
		return nil, err
	}

	a.mu.RLock()
	key, exists = a.publicKeys[kid]
	a.mu.RUnlock()

	if !exists {
		return nil, fmt.Errorf("kein Public Key für kid: %s", kid)
	}

	return key, nil
}

// fetchKeys lädt die JWKS von Keycloak
func (a *AuthMiddleware) fetchKeys() error {
	// Nur alle 5 Minuten neu laden
	if time.Since(a.lastFetch) < 5*time.Minute && len(a.publicKeys) > 0 {
		return nil
	}

	url := fmt.Sprintf("%s/realms/%s/protocol/openid-connect/certs", a.keycloakURL, a.realm)

	resp, err := a.httpClient.Get(url)
	if err != nil {
		return fmt.Errorf("jwks laden fehlgeschlagen: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("jwks endpoint fehler: %d - %s", resp.StatusCode, string(body))
	}

	var jwks JWKS
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return fmt.Errorf("jwks decode fehlgeschlagen: %w", err)
	}

	// Keys parsen und speichern
	a.mu.Lock()
	defer a.mu.Unlock()

	for _, jwk := range jwks.Keys {
		if jwk.Kty != "RSA" {
			continue
		}
		key, err := parseJWK(jwk)
		if err != nil {
			continue // Skip invalid keys
		}
		a.publicKeys[jwk.Kid] = key
	}

	a.lastFetch = time.Now()
	return nil
}

// parseJWK wandelt einen JWK in einen rsa.PublicKey um
func parseJWK(jwk JWK) (*rsa.PublicKey, error) {
	// Decode base64url encoded N
	nBytes, err := base64.RawURLEncoding.DecodeString(jwk.N)
	if err != nil {
		return nil, fmt.Errorf("decode N fehlgeschlagen: %w", err)
	}

	// Decode base64url encoded E
	eBytes, err := base64.RawURLEncoding.DecodeString(jwk.E)
	if err != nil {
		return nil, fmt.Errorf("decode E fehlgeschlagen: %w", err)
	}

	n := new(big.Int).SetBytes(nBytes)
	e := int(new(big.Int).SetBytes(eBytes).Int64())

	return &rsa.PublicKey{
		N: n,
		E: e,
	}, nil
}

// AddPublicKey fügt einen Public Key manuell hinzu (für Tests oder statische Konfiguration)
func (a *AuthMiddleware) AddPublicKey(kid string, key *rsa.PublicKey) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.publicKeys[kid] = key
}

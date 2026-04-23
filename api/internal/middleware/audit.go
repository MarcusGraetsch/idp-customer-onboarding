package middleware

import (
	"context"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/marcusgraetsch/idp-platform/internal/services"
)

// AuditMiddleware loggt automatisch alle API-Requests
type AuditMiddleware struct {
	auditService *services.AuditService
}

// NewAuditMiddleware erstellt eine neue Audit Middleware
func NewAuditMiddleware(auditService *services.AuditService) *AuditMiddleware {
	return &AuditMiddleware{auditService: auditService}
}

// Middleware loggt Requests und Responses
func (a *AuditMiddleware) Middleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Request ausführen
		err := c.Next()

		// Nach dem Request: Audit Log schreiben
		// Nur für mutierende Operationen (POST, PUT, DELETE)
		method := c.Method()
		if method != "POST" && method != "PUT" && method != "DELETE" && method != "PATCH" {
			return err
		}

		// Actor bestimmen
		actor := "anonymous"
		if userEmail, ok := c.Locals("user_email").(string); ok && userEmail != "" {
			actor = fmt.Sprintf("user:%s", userEmail)
		} else if userID, ok := c.Locals("user_id").(string); ok && userID != "" {
			actor = fmt.Sprintf("user:%s", userID)
		}

		// Resource Info
		action := fmt.Sprintf("%s %s", method, c.Path())
		resourceType := "unknown"
		var resourceID uuid.UUID

		// Versuche Resource ID aus Params zu extrahieren
		if idStr := c.Params("id"); idStr != "" {
			if parsed, err := uuid.Parse(idStr); err == nil {
				resourceID = parsed
			}
		}

		// Resource Type aus Path ableiten
		path := c.Path()
		if contains(path, "/tenants") {
			resourceType = "tenant"
		} else if contains(path, "/apps") {
			resourceType = "app"
		} else if contains(path, "/secrets") {
			resourceType = "secret"
		}

		// Details
		details := map[string]interface{}{
			"path":       path,
			"method":     method,
			"status":     c.Response().StatusCode(),
			"duration":   time.Since(start).Milliseconds(),
			"ip":         c.IP(),
			"user_agent": c.Get("User-Agent"),
		}

		// Fire-and-forget: Audit Log nicht blockieren
		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()

			_ = a.auditService.Log(ctx, actor, action, resourceType, resourceID, details)
		}()

		return err
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsSubstring(s, substr))
}

func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

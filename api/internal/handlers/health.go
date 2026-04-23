package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/marcusgraetsch/idp-platform/internal/k8s"
)

// HealthResponse ist die Antwort für Health Checks
type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp time.Time         `json:"timestamp"`
	Version   string            `json:"version"`
	Checks    map[string]Check  `json:"checks"`
}

// Check ist ein einzelner Health Check
type Check struct {
	Status  string `json:"status"`
	Message string `json:"message,omitempty"`
}

// HealthHandler verwaltet Health Checks
type HealthHandler struct {
	db  *pgxpool.Pool
	k8s *k8s.Client
}

// NewHealthHandler erstellt einen neuen HealthHandler
func NewHealthHandler(db *pgxpool.Pool, k8sClient *k8s.Client) *HealthHandler {
	return &HealthHandler{
		db:  db,
		k8s: k8sClient,
	}
}

// Health gibt einen einfachen Health Status zurück (für Load Balancer)
func (h *HealthHandler) Health(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status": "ok",
	})
}

// Readiness prüft ob alle Abhängigkeiten bereit sind
func (h *HealthHandler) Readiness(c *fiber.Ctx) error {
	checks := make(map[string]Check)
	overallStatus := "healthy"

	// Datenbank Check
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := h.db.Ping(ctx); err != nil {
		checks["database"] = Check{
			Status:  "unhealthy",
			Message: err.Error(),
		}
		overallStatus = "unhealthy"
	} else {
		checks["database"] = Check{Status: "healthy"}
	}

	// Kubernetes Check (optional)
	if h.k8s != nil {
		if err := h.k8s.Ping(ctx); err != nil {
			checks["kubernetes"] = Check{
				Status:  "unhealthy",
				Message: err.Error(),
			}
			overallStatus = "unhealthy"
		} else {
			checks["kubernetes"] = Check{Status: "healthy"}
		}
	} else {
		checks["kubernetes"] = Check{
			Status:  "degraded",
			Message: "Kubernetes Client nicht verfügbar",
		}
	}

	statusCode := fiber.StatusOK
	if overallStatus == "unhealthy" {
		statusCode = fiber.StatusServiceUnavailable
	}

	return c.Status(statusCode).JSON(HealthResponse{
		Status:    overallStatus,
		Timestamp: time.Now().UTC(),
		Version:   "0.1.0",
		Checks:    checks,
	})
}

// Liveness prüft ob der Server lebt (einfacher Check)
func (h *HealthHandler) Liveness(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status": "alive",
	})
}

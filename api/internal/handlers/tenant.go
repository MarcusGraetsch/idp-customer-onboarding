package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/marcusgraetsch/idp-platform/internal/models"
	"github.com/marcusgraetsch/idp-platform/internal/services"
)

// ErrorHandler ist der zentrale Fehlerhandler für Fiber
func ErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Interner Serverfehler"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	return c.Status(code).JSON(fiber.Map{
		"error":   message,
		"code":    code,
		"details": err.Error(),
	})
}

// CreateTenant handler für POST /api/v1/tenants
func CreateTenant(service *services.TenantService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req models.CreateTenantRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Ungültige Eingabe: " + err.Error(),
			})
		}

		// Validierung
		if req.Name == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Name ist erforderlich",
			})
		}
		if req.OwnerEmail == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Owner Email ist erforderlich",
			})
		}

		tenant, err := service.Create(c.Context(), req)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Tenant erstellen fehlgeschlagen: " + err.Error(),
			})
		}

		return c.Status(fiber.StatusCreated).JSON(tenant.ToResponse())
	}
}

// ListTenants handler für GET /api/v1/tenants
func ListTenants(service *services.TenantService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenants, err := service.List(c.Context())
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Tenants abrufen fehlgeschlagen: " + err.Error(),
			})
		}

		response := make([]models.TenantResponse, len(tenants))
		for i, t := range tenants {
			response[i] = t.ToResponse()
		}

		return c.JSON(response)
	}
}

// GetTenant handler für GET /api/v1/tenants/:id
func GetTenant(service *services.TenantService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Ungültige UUID: " + err.Error(),
			})
		}

		tenant, err := service.Get(c.Context(), id)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Tenant nicht gefunden",
			})
		}

		return c.JSON(tenant.ToResponse())
	}
}

// DeleteTenant handler für DELETE /api/v1/tenants/:id
func DeleteTenant(service *services.TenantService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Ungültige UUID: " + err.Error(),
			})
		}

		if err := service.Delete(c.Context(), id); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Tenant löschen fehlgeschlagen: " + err.Error(),
			})
		}

		return c.Status(fiber.StatusNoContent).Send(nil)
	}
}

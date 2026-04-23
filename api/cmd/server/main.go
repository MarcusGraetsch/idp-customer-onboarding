package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
	
	"github.com/marcusgraetsch/idp-platform/internal/config"
	"github.com/marcusgraetsch/idp-platform/internal/handlers"
	"github.com/marcusgraetsch/idp-platform/internal/k8s"
	"github.com/marcusgraetsch/idp-platform/internal/services"
)

func main() {
	// .env laden (für lokale Entwicklung)
	godotenv.Load()

	// Konfiguration laden
	cfg := config.Load()

	// Datenbank-Verbindung
	db, err := services.NewDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Datenbank-Verbindung fehlgeschlagen: %v", err)
	}
	defer db.Close()

	// Migrationen ausführen
	if err := services.Migrate(db); err != nil {
		log.Fatalf("Migrationen fehlgeschlagen: %v", err)
	}

	// Kubernetes Client (nur wenn im Cluster oder kubectl verfügbar)
	k8sClient, err := k8s.NewClient()
	if err != nil {
		log.Printf("Warnung: Kubernetes Client nicht verfügbar: %v", err)
		log.Println("API läuft im "Mock-Modus" für Tenants")
	}

	// Services initialisieren
	tenantService := services.NewTenantService(db, k8sClient)

	// Fiber App erstellen
	app := fiber.New(fiber.Config{
		ErrorHandler: handlers.ErrorHandler,
	})

	// Middleware
	app.Use(logger.New())

	// Health Check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// API Routes
	api := app.Group("/api/v1")
	
	// Tenant Routes
	tenants := api.Group("/tenants")
	tenants.Post("/", handlers.CreateTenant(tenantService))
	tenants.Get("/", handlers.ListTenants(tenantService))
	tenants.Get("/:id", handlers.GetTenant(tenantService))
	tenants.Delete("/:id", handlers.DeleteTenant(tenantService))

	// Server starten
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 IDP Platform API läuft auf Port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Server konnte nicht starten: %v", err)
	}
}

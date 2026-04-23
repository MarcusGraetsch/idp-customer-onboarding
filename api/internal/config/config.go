package config

import "os"

// Config enthält alle Konfigurationswerte
type Config struct {
	DatabaseURL string
	K8sConfig   string // Pfad zu kubeconfig (leer = in-cluster)
	Port        string
}

// Load lädt Konfiguration aus Umgebungsvariablen
func Load() Config {
	return Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/idp_platform?sslmode=disable"),
		K8sConfig:   getEnv("KUBECONFIG", ""), // leer = in-cluster
		Port:        getEnv("PORT", "8080"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

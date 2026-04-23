package services

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// NewDB erstellt eine neue Datenbankverbindung
func NewDB(databaseURL string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		return nil, fmt.Errorf("datenbankverbindung fehlgeschlagen: %w", err)
	}

	// Verbindung testen
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("datenbank-ping fehlgeschlagen: %w", err)
	}

	return pool, nil
}

// Migrate führt Datenbank-Migrationen aus
func Migrate(db *pgxpool.Pool) error {
	// Für das MVP erstellen wir die Tabellen direkt
	// Später können wir golang-migrate nutzen
	
	ctx := context.Background()
	
	// Tenants Tabelle
	_, err := db.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS tenants (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR(63) UNIQUE NOT NULL,
			display_name VARCHAR(255),
			tier VARCHAR(50) DEFAULT 'standard',
			status VARCHAR(50) DEFAULT 'active',
			owner_email VARCHAR(255) NOT NULL,
			namespace VARCHAR(63) UNIQUE,
			quota_cpu VARCHAR(50) DEFAULT '10',
			quota_memory VARCHAR(50) DEFAULT '20Gi',
			quota_storage VARCHAR(50) DEFAULT '100Gi',
			created_at TIMESTAMPTZ DEFAULT NOW(),
			updated_at TIMESTAMPTZ DEFAULT NOW(),
			deleted_at TIMESTAMPTZ
		)
	`)
	if err != nil {
		return fmt.Errorf("tenants tabelle erstellen fehlgeschlagen: %w", err)
	}

	// Audit Log Tabelle
	_, err = db.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS audit_log (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			actor VARCHAR(255),
			action VARCHAR(100) NOT NULL,
			resource_type VARCHAR(100),
			resource_id UUID,
			details JSONB,
			created_at TIMESTAMPTZ DEFAULT NOW()
		)
	`)
	if err != nil {
		return fmt.Errorf("audit_log tabelle erstellen fehlgeschlagen: %w", err)
	}

	// Events Tabelle (für Event Bus)
	_, err = db.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS events (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			type VARCHAR(100) NOT NULL,
			tenant_id UUID REFERENCES tenants(id),
			payload JSONB,
			created_at TIMESTAMPTZ DEFAULT NOW()
		)
	`)
	if err != nil {
		return fmt.Errorf("events tabelle erstellen fehlgeschlagen: %w", err)
	}

	return nil
}

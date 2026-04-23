package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/marcusgraetsch/idp-platform/internal/k8s"
	"github.com/marcusgraetsch/idp-platform/internal/models"
)

// TenantService verwaltet Tenants und deren K8s Ressourcen
type TenantService struct {
	db  *pgxpool.Pool
	k8s *k8s.Client
}

// NewTenantService erstellt einen neuen TenantService
func NewTenantService(db *pgxpool.Pool, k8sClient *k8s.Client) *TenantService {
	return &TenantService{
		db:  db,
		k8s: k8sClient,
	}
}

// Create erstellt einen neuen Tenant + K8s Namespace
func (s *TenantService) Create(ctx context.Context, req models.CreateTenantRequest) (*models.Tenant, error) {
	tenant := &models.Tenant{
		ID:           uuid.New(),
		Name:         req.Name,
		DisplayName:  req.DisplayName,
		Tier:         defaultString(req.Tier, "standard"),
		Status:       "active",
		OwnerEmail:   req.OwnerEmail,
		Namespace:    fmt.Sprintf("tenant-%s", req.Name),
		QuotaCPU:     defaultString(req.QuotaCPU, "10"),
		QuotaMemory:  defaultString(req.QuotaMemory, "20Gi"),
		QuotaStorage: defaultString(req.QuotaStorage, "100Gi"),
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}

	// In DB speichern
	_, err := s.db.Exec(ctx, `
		INSERT INTO tenants (id, name, display_name, tier, status, owner_email, namespace, quota_cpu, quota_memory, quota_storage, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`, tenant.ID, tenant.Name, tenant.DisplayName, tenant.Tier, tenant.Status,
		tenant.OwnerEmail, tenant.Namespace, tenant.QuotaCPU, tenant.QuotaMemory, tenant.QuotaStorage,
		tenant.CreatedAt, tenant.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("tenant erstellen fehlgeschlagen: %w", err)
	}

	// K8s Namespace erstellen (wenn K8s verfügbar)
	if s.k8s != nil {
		if err := s.k8s.CreateNamespace(ctx, tenant.Namespace, tenant.Name); err != nil {
			// Namespace-Fehler soll nicht den Tenant blockieren
			// TODO: Retry-Queue oder Event
			fmt.Printf("Warnung: Namespace erstellen fehlgeschlagen: %v\n", err)
		}
	}

	return tenant, nil
}

// List gibt alle Tenants zurück (ohne gelöschte)
func (s *TenantService) List(ctx context.Context) ([]models.Tenant, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, name, display_name, tier, status, owner_email, namespace, 
		       quota_cpu, quota_memory, quota_storage, created_at, updated_at
		FROM tenants 
		WHERE deleted_at IS NULL 
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("tenants abrufen fehlgeschlagen: %w", err)
	}
	defer rows.Close()

	var tenants []models.Tenant
	for rows.Next() {
		var t models.Tenant
		err := rows.Scan(
			&t.ID, &t.Name, &t.DisplayName, &t.Tier, &t.Status,
			&t.OwnerEmail, &t.Namespace, &t.QuotaCPU, &t.QuotaMemory, &t.QuotaStorage,
			&t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("tenant scannen fehlgeschlagen: %w", err)
		}
		tenants = append(tenants, t)
	}

	return tenants, rows.Err()
}

// Get gibt einen Tenant anhand ID zurück
func (s *TenantService) Get(ctx context.Context, id uuid.UUID) (*models.Tenant, error) {
	var t models.Tenant
	err := s.db.QueryRow(ctx, `
		SELECT id, name, display_name, tier, status, owner_email, namespace,
		       quota_cpu, quota_memory, quota_storage, created_at, updated_at
		FROM tenants 
		WHERE id = $1 AND deleted_at IS NULL
	`, id).Scan(
		&t.ID, &t.Name, &t.DisplayName, &t.Tier, &t.Status,
		&t.OwnerEmail, &t.Namespace, &t.QuotaCPU, &t.QuotaMemory, &t.QuotaStorage,
		&t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("tenant nicht gefunden: %w", err)
	}
	return &t, nil
}

// Delete setzt deleted_at (Soft Delete)
func (s *TenantService) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := s.db.Exec(ctx, `
		UPDATE tenants SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL
	`, time.Now().UTC(), id)
	if err != nil {
		return fmt.Errorf("tenant löschen fehlgeschlagen: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("tenant nicht gefunden oder bereits gelöscht")
	}

	return nil
}

// Hilfsfunktion
func defaultString(s, defaultValue string) string {
	if s == "" {
		return defaultValue
	}
	return s
}

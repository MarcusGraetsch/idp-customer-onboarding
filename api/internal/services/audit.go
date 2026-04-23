package services

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/marcusgraetsch/idp-platform/internal/models"
)

// AuditService verwaltet das Audit Log
type AuditService struct {
	db *pgxpool.Pool
}

// NewAuditService erstellt einen neuen AuditService
func NewAuditService(db *pgxpool.Pool) *AuditService {
	return &AuditService{db: db}
}

// Log schreibt einen Audit-Log-Eintrag
func (s *AuditService) Log(ctx context.Context, actor, action, resourceType string, resourceID uuid.UUID, details interface{}) error {
	detailsJSON, err := json.Marshal(details)
	if err != nil {
		detailsJSON = []byte("{}")
	}

	_, err = s.db.Exec(ctx, `
		INSERT INTO audit_log (actor, action, resource_type, resource_id, details)
		VALUES ($1, $2, $3, $4, $5)
	`, actor, action, resourceType, resourceID, detailsJSON)

	if err != nil {
		return fmt.Errorf("audit log schreiben fehlgeschlagen: %w", err)
	}

	return nil
}

// List gibt Audit-Log-Einträge zurück (paginiert)
func (s *AuditService) List(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]models.AuditLog, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, actor, action, resource_type, resource_id, details, created_at
		FROM audit_log
		WHERE ($1::uuid IS NULL OR resource_id = $1)
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, tenantID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("audit log abrufen fehlgeschlagen: %w", err)
	}
	defer rows.Close()

	var logs []models.AuditLog
	for rows.Next() {
		var log models.AuditLog
		var detailsJSON []byte
		err := rows.Scan(
			&log.ID, &log.Actor, &log.Action, &log.ResourceType,
			&log.ResourceID, &detailsJSON, &log.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("audit log scannen fehlgeschlagen: %w", err)
		}
		log.Details = detailsJSON
		logs = append(logs, log)
	}

	return logs, rows.Err()
}

package models

import (
	"time"

	"github.com/google/uuid"
)

// AuditLog speichert alle Aktionen im System
type AuditLog struct {
	ID           uuid.UUID `json:"id" db:"id"`
	Actor        string    `json:"actor" db:"actor"` // z.B. "user:marcus@example.com" oder "agent:rook"
	Action       string    `json:"action" db:"action"`
	ResourceType string    `json:"resource_type" db:"resource_type"`
	ResourceID   uuid.UUID `json:"resource_id" db:"resource_id"`
	Details      []byte    `json:"details" db:"details"` // JSONB
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

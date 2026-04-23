package models

import (
	"time"

	"github.com/google/uuid"
)

// Tenant repräsentiert einen Kunden/Projekt im System
type Tenant struct {
	ID           uuid.UUID `json:"id" db:"id"`
	Name         string    `json:"name" db:"name"`                 // DNS-kompatibel, z.B. "mueller-gmbh"
	DisplayName  string    `json:"display_name" db:"display_name"` // Menschenlesbar
	Tier         string    `json:"tier" db:"tier"`                 // free, standard, premium
	Status       string    `json:"status" db:"status"`             // active, suspended, deleted
	OwnerEmail   string    `json:"owner_email" db:"owner_email"`
	Namespace    string    `json:"namespace" db:"namespace"`       // K8s Namespace
	QuotaCPU     string    `json:"quota_cpu" db:"quota_cpu"`
	QuotaMemory  string    `json:"quota_memory" db:"quota_memory"`
	QuotaStorage string    `json:"quota_storage" db:"quota_storage"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// CreateTenantRequest ist der Body für POST /api/v1/tenants
type CreateTenantRequest struct {
	Name         string `json:"name" validate:"required,min=3,max=63"`
	DisplayName  string `json:"display_name"`
	OwnerEmail   string `json:"owner_email" validate:"required,email"`
	Tier         string `json:"tier" validate:"omitempty,oneof=free standard premium"`
	QuotaCPU     string `json:"quota_cpu"`
	QuotaMemory  string `json:"quota_memory"`
	QuotaStorage string `json:"quota_storage"`
}

// TenantResponse ist die API-Antwort für einen Tenant
type TenantResponse struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	DisplayName string    `json:"display_name"`
	Status      string    `json:"status"`
	Namespace   string    `json:"namespace"`
	CreatedAt   time.Time `json:"created_at"`
}

// ToResponse wandelt Tenant in TenantResponse um
func (t *Tenant) ToResponse() TenantResponse {
	return TenantResponse{
		ID:          t.ID,
		Name:        t.Name,
		DisplayName: t.DisplayName,
		Status:      t.Status,
		Namespace:   t.Namespace,
		CreatedAt:   t.CreatedAt,
	}
}

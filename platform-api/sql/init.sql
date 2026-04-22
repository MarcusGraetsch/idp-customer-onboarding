CREATE SCHEMA IF NOT EXISTS platform;

CREATE TABLE IF NOT EXISTS platform.clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    customer_type VARCHAR(50) NOT NULL CHECK (customer_type IN ('internal-dev', 'external-customer')),
    provider VARCHAR(50) NOT NULL DEFAULT 'kind',
    size VARCHAR(20) NOT NULL CHECK (size IN ('small', 'medium', 'large')),
    region VARCHAR(100) DEFAULT 'local',
    addons TEXT[] DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'provisioning' CHECK (status IN ('provisioning', 'running', 'scaling', 'error', 'deleted')),
    nodes INTEGER DEFAULT 1,
    environment VARCHAR(20) DEFAULT 'dev' CHECK (environment IN ('dev', 'prod')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('incident', 'problem', 'request', 'question')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'reopened')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    subject VARCHAR(500) NOT NULL,
    description TEXT,
    assigned_to VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    sla_deadline TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('cluster_create', 'quota_increase', 'region_enable', 'platform_update')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requester VARCHAR(255) NOT NULL,
    approver VARCHAR(255),
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clusters_owner ON platform.clusters(owner);
CREATE INDEX IF NOT EXISTS idx_clusters_status ON platform.clusters(status);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON platform.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_customer ON platform.tickets(customer_id);
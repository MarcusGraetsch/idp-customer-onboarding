const Fastify = require('fastify');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const { Pool } = require('pg');

const app = Fastify({ logger: true });

// Database connection
const pool = new Pool({
  host: process.env.PGHOST || 'postgresql.platform-dev.svc.cluster.local',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'platform',
  user: process.env.PGUSER || 'platform-admin',
  password: process.env.PGPASSWORD || 'plat0form-dev-2026!',
});

// CORS
app.register(cors, {
  origin: true,
  credentials: true
});

// JWT (placeholder - Keycloak will handle real auth)
app.register(jwt, {
  secret: process.env.JWT_SECRET || 'platform-dev-secret-change-in-prod'
});

// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// --- Clusters ---

app.post('/api/clusters', async (req, reply) => {
  const { name, owner, customer_type, size, region, addons, provider } = req.body;
  
  if (!name || !owner || !customer_type || !size) {
    return reply.status(400).send({ error: 'Missing required fields' });
  }

  const result = await pool.query(
    `INSERT INTO platform.clusters (name, owner, customer_type, size, region, addons, provider, status, nodes, environment)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'provisioning', 1, 'dev')
     RETURNING *`,
    [name, owner, customer_type, size, region || 'local', addons || [], provider || 'kind']
  );
  
  return { cluster: result.rows[0] };
});

app.get('/api/clusters', async (req, reply) => {
  const result = await pool.query(
    'SELECT * FROM platform.clusters WHERE status != $1 ORDER BY created_at DESC',
    ['deleted']
  );
  return { clusters: result.rows };
});

app.get('/api/clusters/:id', async (req, reply) => {
  const { id } = req.params;
  const result = await pool.query(
    'SELECT * FROM platform.clusters WHERE id = $1',
    [id]
  );
  if (result.rows.length === 0) {
    return reply.status(404).send({ error: 'Cluster not found' });
  }
  return { cluster: result.rows[0] };
});

app.put('/api/clusters/:id/scale', async (req, reply) => {
  const { id } = req.params;
  const { nodes } = req.body;
  
  if (!nodes || nodes < 1) {
    return reply.status(400).send({ error: 'Invalid node count' });
  }

  const result = await pool.query(
    `UPDATE platform.clusters SET nodes = $1, status = 'scaling', updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [nodes, id]
  );
  
  // Simulate async scaling - in reality this would trigger Flux/Kubernetes
  setTimeout(async () => {
    await pool.query(
      `UPDATE platform.clusters SET status = 'running', updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }, 3000);
  
  return { cluster: result.rows[0] };
});

app.delete('/api/clusters/:id', async (req, reply) => {
  const { id } = req.params;
  const result = await pool.query(
    `UPDATE platform.clusters SET status = 'deleted', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  return { deleted: result.rows[0] };
});

// --- Tickets ---

app.post('/api/tickets', async (req, reply) => {
  const { customer_id, type, priority, subject, description } = req.body;
  
  if (!customer_id || !type || !subject) {
    return reply.status(400).send({ error: 'Missing required fields' });
  }

  // SLA calculation based on priority
  const slaHours = { low: 48, medium: 24, high: 8, critical: 1 };
  const slaDeadline = new Date(Date.now() + (slaHours[priority] || 24) * 3600000);

  const result = await pool.query(
    `INSERT INTO platform.tickets (customer_id, type, priority, subject, description, sla_deadline)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [customer_id, type, priority || 'medium', subject, description, slaDeadline]
  );
  
  return { ticket: result.rows[0] };
});

app.get('/api/tickets', async (req, reply) => {
  const result = await pool.query(
    'SELECT * FROM platform.tickets ORDER BY created_at DESC'
  );
  return { tickets: result.rows };
});

app.get('/api/tickets/:id', async (req, reply) => {
  const { id } = req.params;
  const result = await pool.query(
    'SELECT * FROM platform.tickets WHERE id = $1',
    [id]
  );
  if (result.rows.length === 0) {
    return reply.status(404).send({ error: 'Ticket not found' });
  }
  return { ticket: result.rows[0] };
});

app.put('/api/tickets/:id', async (req, reply) => {
  const { id } = req.params;
  const { status, assigned_to } = req.body;
  
  const updates = [];
  const values = [];
  let paramCount = 1;
  
  if (status) {
    updates.push(`status = $${paramCount++}`);
    values.push(status);
    if (status === 'resolved') {
      updates.push(`resolved_at = NOW()`);
    }
  }
  if (assigned_to) {
    updates.push(`assigned_to = $${paramCount++}`);
    values.push(assigned_to);
  }
  
  updates.push('updated_at = NOW()');
  values.push(id);
  
  const result = await pool.query(
    `UPDATE platform.tickets SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  
  return { ticket: result.rows[0] };
});

// --- Approvals ---

app.post('/api/approvals', async (req, reply) => {
  const { type, requester, reason } = req.body;
  
  if (!type || !requester) {
    return reply.status(400).send({ error: 'Missing required fields' });
  }

  const result = await pool.query(
    `INSERT INTO platform.approvals (type, requester, reason)
     VALUES ($1, $2, $3) RETURNING *`,
    [type, requester, reason]
  );
  
  return { approval: result.rows[0] };
});

app.get('/api/approvals', async (req, reply) => {
  const result = await pool.query(
    'SELECT * FROM platform.approvals ORDER BY created_at DESC'
  );
  return { approvals: result.rows };
});

app.put('/api/approvals/:id', async (req, reply) => {
  const { id } = req.params;
  const { status, approver } = req.body;
  
  if (!status || !['approved', 'rejected'].includes(status)) {
    return reply.status(400).send({ error: 'Invalid status' });
  }

  const result = await pool.query(
    `UPDATE platform.approvals SET status = $1, approver = $2, resolved_at = NOW()
     WHERE id = $3 RETURNING *`,
    [status, approver, id]
  );
  
  return { approval: result.rows[0] };
});

// --- Meta ---

app.get('/api/addons', async () => ({
  addons: [
    { id: 'trivy', name: 'Trivy', description: 'Vulnerability Scanner' },
    { id: 'polaris', name: 'Polaris', description: 'Best Practice Validator' },
    { id: 'monitoring', name: 'Monitoring', description: 'Prometheus + Grafana' },
    { id: 'ingress', name: 'Ingress', description: 'NGINX Ingress Controller' }
  ]
}));

app.get('/api/regions', async () => ({
  regions: [
    { id: 'local', name: 'Local (Kind)', available: true },
    { id: 'fsn1', name: 'Falkenstein (Hetzner)', available: false },
    { id: 'ash', name: 'Ashburn (AWS)', available: false }
  ]
}));

// Start
const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Platform API running on :3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
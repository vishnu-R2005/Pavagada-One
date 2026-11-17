-- Stage 1: identity, secure sessions, roles, and audit trail.
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE TABLE audit_logs (id TEXT PRIMARY KEY, actor_id TEXT REFERENCES users(id), action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT, metadata_json TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at);
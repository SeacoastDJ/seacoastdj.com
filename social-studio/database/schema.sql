-- MySQL migration target for the planned database adapter.
-- Version 1.0 does not execute this schema.
CREATE TABLE projects (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(190) NOT NULL,
  town VARCHAR(190) NOT NULL DEFAULT '',
  vertical VARCHAR(32) NOT NULL DEFAULT '',
  materials TEXT,
  features TEXT,
  stage VARCHAR(32) NOT NULL DEFAULT 'finished',
  status VARCHAR(32) NOT NULL DEFAULT 'new',
  privacy_approved BOOLEAN NOT NULL DEFAULT FALSE,
  hide_identity BOOLEAN NOT NULL DEFAULT TRUE,
  exact_location_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE media (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT media_project_fk FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE drafts (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  format VARCHAR(50) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT drafts_project_fk FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create tsvector column for full-text search on claims
-- This will be handled by SQLAlchemy migrations

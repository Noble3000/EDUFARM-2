-- EduFarm local database setup — run ONCE as the postgres superuser.
-- Option A (psql):  psql -U postgres -h localhost -f scripts/setup-db.sql
-- Option B (pgAdmin): open this file in Query Tool as postgres and execute.
--
-- After this: copy web/.env.example to web/.env and fill DATABASE_URL with
-- the edufarm password you choose below, plus a generated BETTER_AUTH_SECRET.

-- App role (least privilege; DDL only via drizzle-kit migrate as postgres)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'edufarm') THEN
    CREATE ROLE edufarm WITH LOGIN PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
  END IF;
END
$$;

-- Dev + prod databases owned by the app role
SELECT 'CREATE DATABASE edufarm_dev OWNER edufarm'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'edufarm_dev')\gexec

SELECT 'CREATE DATABASE edufarm_prod OWNER edufarm'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'edufarm_prod')\gexec

-- pgvector for Phase 8 course-material retrieval (ignored if extension missing)
\c edufarm_dev
CREATE EXTENSION IF NOT EXISTS vector;
\c edufarm_prod
CREATE EXTENSION IF NOT EXISTS vector;

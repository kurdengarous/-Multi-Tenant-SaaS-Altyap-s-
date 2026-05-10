import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from './database.service';

/**
 * Migrations executed at boot. In a real product these would live as
 * versioned SQL files run by a separate job; here we keep it inline so the
 * project boots end-to-end with `docker compose up`.
 *
 * Layout:
 *  public.tenants         — tenant registry (slug, schema, plan)
 *  public.users           — global identity (one user, many tenants)
 *  public.tenant_users    — membership + role per (user, tenant)
 *  public.subscriptions   — plan + limits per tenant
 *  public.audit_log       — ROW-LEVEL ISOLATION DEMO (tenant_id column)
 *
 *  <tenant>.projects      — per-tenant business data (schema-per-tenant)
 *  <tenant>.resources
 *  <tenant>.usage_logs
 */
@Injectable()
export class MigrationsService {
  private readonly log = new Logger('Migrations');

  constructor(private readonly db: DatabaseService) {}

  async run() {
    await this.db.withClient(async (c) => {
      // -------- public schema --------
      await c.query(`
        CREATE TABLE IF NOT EXISTS public.tenants (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          slug        TEXT UNIQUE NOT NULL,
          name        TEXT NOT NULL,
          schema_name TEXT UNIQUE NOT NULL,
          created_at  TIMESTAMPTZ DEFAULT now()
        );
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS public.users (
          id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email         TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name          TEXT,
          created_at    TIMESTAMPTZ DEFAULT now()
        );
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS public.tenant_users (
          tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
          user_id   UUID NOT NULL REFERENCES public.users(id)   ON DELETE CASCADE,
          role      TEXT NOT NULL CHECK (role IN ('admin','member')),
          PRIMARY KEY (tenant_id, user_id)
        );
      `);
      await c.query(`
        CREATE TABLE IF NOT EXISTS public.subscriptions (
          tenant_id     UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
          plan          TEXT NOT NULL CHECK (plan IN ('starter','pro','enterprise')),
          max_users     INT  NOT NULL,
          max_projects  INT  NOT NULL,
          api_limit     INT  NOT NULL,
          storage_mb    INT  NOT NULL,
          updated_at    TIMESTAMPTZ DEFAULT now()
        );
      `);
      // ---- ROW-LEVEL ISOLATION DEMO (alternative strategy) ----
      // Same table holds rows from every tenant; every query MUST filter
      // on tenant_id. Cheaper to operate, but every query is one bug
      // away from a cross-tenant leak — which is exactly why we picked
      // schema-per-tenant as the primary strategy.
      await c.query(`
        CREATE TABLE IF NOT EXISTS public.audit_log (
          id         BIGSERIAL PRIMARY KEY,
          tenant_id  UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
          actor      TEXT,
          action     TEXT,
          created_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS audit_log_tenant_idx ON public.audit_log(tenant_id);
      `);
    });
    this.log.log('public schema ready');
  }

  /**
   * Build a fresh tenant schema. Called when a tenant is provisioned.
   * Idempotent: safe to run on every boot.
   */
  async ensureTenantSchema(schema: string) {
    const safe = this.db.safeSchema(schema);
    await this.db.withClient(async (c) => {
      await c.query(`CREATE SCHEMA IF NOT EXISTS ${safe}`);
      await c.query(`
        CREATE TABLE IF NOT EXISTS ${safe}.projects (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name        TEXT NOT NULL,
          description TEXT,
          created_by  UUID,
          created_at  TIMESTAMPTZ DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS ${safe}.resources (
          id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID REFERENCES ${safe}.projects(id) ON DELETE CASCADE,
          kind       TEXT,
          name       TEXT,
          size_mb    INT DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS ${safe}.usage_logs (
          id         BIGSERIAL PRIMARY KEY,
          endpoint   TEXT,
          actor      UUID,
          at         TIMESTAMPTZ DEFAULT now()
        );
      `);
    });
    this.log.log(`schema ${safe} ready`);
  }
}

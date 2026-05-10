import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { currentTenant } from '../common/tenant-context';

@Injectable()
export class TenantsService {
  constructor(private readonly db: DatabaseService) {}

  /** Used by the workspace selector — public, no tenant required. */
  async listAll() {
    return this.db.publicQuery(
      `SELECT t.slug, t.name, s.plan
         FROM public.tenants t
         LEFT JOIN public.subscriptions s ON s.tenant_id = t.id
         ORDER BY t.slug`,
    );
  }

  /** Returns full info about the current tenant (from context). */
  async currentInfo() {
    const ctx = currentTenant();
    const rows = await this.db.publicQuery(
      `SELECT t.id, t.slug, t.name, t.schema_name, s.plan,
              s.max_users, s.max_projects, s.api_limit, s.storage_mb
         FROM public.tenants t
         LEFT JOIN public.subscriptions s ON s.tenant_id = t.id
        WHERE t.id = $1`,
      [ctx.tenantId],
    );
    return rows[0];
  }

  /**
   * Dashboard analytics — proves we are reading from THE TENANT'S schema.
   * Counts come from `${schema}.projects` etc., not from public tables.
   */
  async dashboard() {
    const ctx = currentTenant();
    const [projects] = await this.db.tenantQuery<{ n: number }>(
      `SELECT count(*)::int AS n FROM projects`,
    );
    const [resources] = await this.db.tenantQuery<{ n: number }>(
      `SELECT count(*)::int AS n FROM resources`,
    );
    const [storage] = await this.db.tenantQuery<{ used: number }>(
      `SELECT COALESCE(SUM(size_mb),0)::int AS used FROM resources`,
    );
    const [users] = await this.db.publicQuery<{ n: number }>(
      `SELECT count(*)::int AS n FROM public.tenant_users WHERE tenant_id = $1`,
      [ctx.tenantId],
    );
    return {
      tenant: { slug: ctx.slug, schema: ctx.schema, plan: ctx.plan },
      counts: {
        projects: projects.n,
        resources: resources.n,
        users: users.n,
        storage_mb_used: storage.used,
      },
    };
  }
}

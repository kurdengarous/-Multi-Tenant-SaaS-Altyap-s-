import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../database/database.service';
import { tenantStorage, TenantContext } from '../common/tenant-context';

/**
 * Resolves the active tenant for every request.
 *
 * Resolution order:
 *  1. `X-Tenant` header        (used by frontend & curl in dev)
 *  2. First subdomain of Host  (acme.app.local → "acme")
 *
 * If no tenant is found we still allow the request through *without*
 * a context — public endpoints like /api/health and /api/tenants/list
 * (workspace selector) can run unscoped. Tenant-scoped services call
 * `currentTenant()` which throws if nobody set up the context.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly db: DatabaseService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const slug = this.extractSlug(req);
    if (!slug) return next();

    const rows = await this.db.publicQuery<{
      id: string; slug: string; schema_name: string; plan: string;
    }>(
      `SELECT t.id, t.slug, t.schema_name, s.plan
         FROM public.tenants t
         LEFT JOIN public.subscriptions s ON s.tenant_id = t.id
        WHERE t.slug = $1`,
      [slug],
    );
    if (rows.length === 0) {
      throw new NotFoundException(`Unknown tenant: ${slug}`);
    }
    const t = rows[0];
    const ctx: TenantContext = {
      tenantId: t.id,
      slug: t.slug,
      schema: t.schema_name,
      plan: (t.plan as any) || 'starter',
    };
    (req as any).tenant = ctx;
    tenantStorage.run(ctx, () => next());
  }

  private extractSlug(req: Request): string | null {
    const header = (req.headers['x-tenant'] as string | undefined)?.trim().toLowerCase();
    if (header) return header;
    const host = (req.headers.host || '').split(':')[0]; // strip port
    const parts = host.split('.');
    // localhost / 127.0.0.1 / single-label hosts → no tenant
    if (parts.length < 2 || host === 'localhost') return null;
    const sub = parts[0].toLowerCase();
    if (['www', 'api', 'app'].includes(sub)) return null;
    return sub;
  }
}

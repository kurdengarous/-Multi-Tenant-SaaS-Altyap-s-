import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from './database.service';
import { MigrationsService } from './migrations.service';
import { PLANS, PlanName } from '../billing/plans';

/**
 * Idempotent seed: 3 tenants, sample users, subscriptions, projects.
 * Default password for every seeded user: "password123".
 */
@Injectable()
export class SeedService {
  private readonly log = new Logger('Seed');

  constructor(
    private readonly db: DatabaseService,
    private readonly migrations: MigrationsService,
  ) {}

  async run() {
    const tenants: { slug: string; name: string; plan: PlanName }[] = [
      { slug: 'tatvantv', name: 'Tatvan TV',    plan: 'pro' },
      { slug: 'ahlattv',  name: 'Ahlat TV', plan: 'starter' },
      { slug: 'norsintv', name: 'Norşin TV',    plan: 'enterprise' },
    ];

    const passwordHash = await bcrypt.hash('password123', 10);

    for (const t of tenants) {
      // tenants row
      const rows = await this.db.publicQuery<{ id: string }>(
        `INSERT INTO public.tenants (slug, name, schema_name)
         VALUES ($1, $2, $1)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [t.slug, t.name],
      );
      const tenantId = rows[0].id;

      // physical schema + per-tenant tables
      await this.migrations.ensureTenantSchema(t.slug);

      // subscription
      const limits = PLANS[t.plan];
      await this.db.publicQuery(
        `INSERT INTO public.subscriptions
            (tenant_id, plan, max_users, max_projects, api_limit, storage_mb)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (tenant_id) DO UPDATE
           SET plan=EXCLUDED.plan,
               max_users=EXCLUDED.max_users,
               max_projects=EXCLUDED.max_projects,
               api_limit=EXCLUDED.api_limit,
               storage_mb=EXCLUDED.storage_mb,
               updated_at=now()`,
        [tenantId, t.plan, limits.max_users, limits.max_projects, limits.api_limit, limits.storage_mb],
      );

      // admin + member user (same email pattern across tenants to demonstrate
      // that one identity can belong to many tenants)
      const adminEmail = `admin@${t.slug}.app.local`;
      const memberEmail = `member@${t.slug}.app.local`;

      const adminId = await this.upsertUser(adminEmail, passwordHash, `${t.name} Admin`);
      const memberId = await this.upsertUser(memberEmail, passwordHash, `${t.name} Member`);

      await this.upsertMembership(tenantId, adminId, 'admin');
      await this.upsertMembership(tenantId, memberId, 'member');

      // sample projects in tenant schema
      await this.db.withClient(async (c) => {
        await c.query(`SET search_path TO ${t.slug}, public`);
        const existing = await c.query(`SELECT count(*)::int AS n FROM projects`);
        if (existing.rows[0].n === 0) {
          await c.query(
            `INSERT INTO projects (name, description, created_by)
             VALUES ($1,$2,$3),($4,$5,$3)`,
            [
              `${t.name} — Website`, 'Marketing website project', adminId,
              `${t.name} — Internal API`, 'Backend services',
            ],
          );
        }
      });
    }

    this.log.log('seed complete (default password: password123)');
  }

  private async upsertUser(email: string, hash: string, name: string): Promise<string> {
    const rows = await this.db.publicQuery<{ id: string }>(
      `INSERT INTO public.users (email, password_hash, name)
       VALUES ($1,$2,$3)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [email, hash, name],
    );
    return rows[0].id;
  }

  private async upsertMembership(tenantId: string, userId: string, role: 'admin' | 'member') {
    await this.db.publicQuery(
      `INSERT INTO public.tenant_users (tenant_id, user_id, role)
       VALUES ($1,$2,$3)
       ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [tenantId, userId, role],
    );
  }
}

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BillingService } from '../billing/billing.service';

/**
 * Projects live in the *tenant* schema. Every method calls `tenantQuery`
 * which sets `search_path` to <tenant_schema>, public — so unqualified
 * `projects` always refers to the current tenant's table.
 */
@Injectable()
export class ProjectsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly billing: BillingService,
  ) {}

  list() {
    return this.db.tenantQuery(
      `SELECT id, name, description, created_at FROM projects ORDER BY created_at DESC`,
    );
  }

  async create(name: string, description: string, userId: string) {
    await this.billing.assertCanAddProject(); // SaaS limit enforcement
    const rows = await this.db.tenantQuery<any>(
      `INSERT INTO projects (name, description, created_by)
       VALUES ($1,$2,$3) RETURNING id, name, description, created_at`,
      [name, description ?? null, userId],
    );
    return rows[0];
  }
}

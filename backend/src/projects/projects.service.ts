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

  async update(id: string, name: string, description: string) {
    const rows = await this.db.tenantQuery<any>(
      `UPDATE projects SET name=$2, description=$3 WHERE id=$1
       RETURNING id, name, description, created_at`,
      [id, name, description ?? null],
    );
    return rows[0];
  }

  async delete(id: string) {
    await this.db.tenantQuery(`DELETE FROM projects WHERE id=$1`, [id]);
    return { success: true };
  }
}

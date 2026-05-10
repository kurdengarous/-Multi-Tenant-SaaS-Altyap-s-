import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { currentTenant } from '../common/tenant-context';

/**
 * Single shared pg Pool. We do NOT open a separate pool per tenant — that
 * would explode connection counts. Instead, isolation is enforced at
 * query time by setting `search_path` per checked-out connection.
 */
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString:
        process.env.DATABASE_URL || 'postgres://saas:saas@localhost:5432/saas',
      max: 10,
    });
  }

  /** Run a query against the shared `public` schema. */
  async publicQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      await client.query('SET search_path TO public');
      const res = await client.query(sql, params);
      return res.rows as T[];
    } finally {
      client.release();
    }
  }

  /**
   * Run a query against the *current tenant's* schema.
   *
   * SECURITY: schema name is whitelisted (alphanumeric + underscore only)
   * and pulled from a server-side resolved TenantContext, never from user
   * input. This is the boundary that prevents tenant A from reading
   * tenant B's tables.
   */
  async tenantQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const ctx = currentTenant();
    const schema = this.safeSchema(ctx.schema);
    const client = await this.pool.connect();
    try {
      // search_path scopes unqualified table names to <tenant>, then public
      // for any shared lookup tables. Tenant A *cannot* address tenant B's
      // tables without an explicit qualified name, which we never build
      // from user input.
      await client.query(`SET search_path TO ${schema}, public`);
      const res = await client.query(sql, params);
      return res.rows as T[];
    } finally {
      client.release();
    }
  }

  /** For migrations / seed: borrow a raw client. */
  async withClient<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      return await fn(client);
    } finally {
      client.release();
    }
  }

  safeSchema(name: string): string {
    if (!/^[a-z][a-z0-9_]{0,31}$/.test(name)) {
      throw new Error(`Refusing unsafe schema name: ${name}`);
    }
    return name;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}

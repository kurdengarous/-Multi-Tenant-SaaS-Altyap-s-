import { ConflictException, Injectable, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';
import { currentTenant } from '../common/tenant-context';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly billing: BillingService,
  ) {}

  async list() {
    const ctx = currentTenant();
    return this.db.publicQuery(
      `SELECT u.id, u.email, u.name, tu.role
         FROM public.users u
         JOIN public.tenant_users tu ON tu.user_id = u.id
        WHERE tu.tenant_id = $1
        ORDER BY u.email`,
      [ctx.tenantId],
    );
  }

  async invite(email: string, name: string, role: 'admin' | 'member', actorRole: string) {
    if (actorRole !== 'admin') throw new ForbiddenException('admin only');
    const ctx = currentTenant();

    // SaaS limit: enforce max_users from subscription
    await this.billing.assertCanAddUser();

    const hash = await bcrypt.hash('password123', 10);
    const userRows = await this.db.publicQuery<any>(
      `INSERT INTO public.users (email, password_hash, name)
       VALUES ($1,$2,$3)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [email, hash, name],
    );
    const userId = userRows[0].id;

    const exists = await this.db.publicQuery(
      `SELECT 1 FROM public.tenant_users WHERE tenant_id=$1 AND user_id=$2`,
      [ctx.tenantId, userId],
    );
    if (exists.length) throw new ConflictException('User already in tenant');

    await this.db.publicQuery(
      `INSERT INTO public.tenant_users (tenant_id, user_id, role) VALUES ($1,$2,$3)`,
      [ctx.tenantId, userId, role],
    );
    return { id: userId, email, name, role };
  }
}

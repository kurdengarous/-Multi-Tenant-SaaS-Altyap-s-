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

  async invite(email: string, name: string, role: 'admin' | 'member', password?: string, actorRole?: string) {
    if (actorRole !== 'admin') throw new ForbiddenException('admin only');
    const ctx = currentTenant();

    // SaaS limit: enforce max_users from subscription
    await this.billing.assertCanAddUser();

    const pwd = password || 'password123';
    const hash = await bcrypt.hash(pwd, 10);
    const userRows = await this.db.publicQuery<any>(
      `INSERT INTO public.users (email, password_hash, name)
       VALUES ($1,$2,$3)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = $2
       RETURNING id`,
      [email, hash, name],
    );
    const userId = userRows[0].id;

    const exists = await this.db.publicQuery(
      `SELECT 1 FROM public.tenant_users WHERE tenant_id=$1 AND user_id=$2`,
      [ctx.tenantId, userId],
    );
    if (exists.length) {
      // If already in tenant, just update role
      await this.db.publicQuery(
        `UPDATE public.tenant_users SET role=$3 WHERE tenant_id=$1 AND user_id=$2`,
        [ctx.tenantId, userId, role],
      );
    } else {
      await this.db.publicQuery(
        `INSERT INTO public.tenant_users (tenant_id, user_id, role) VALUES ($1,$2,$3)`,
        [ctx.tenantId, userId, role],
      );
    }
    return { id: userId, email, name, role };
  }

  async getProfile(userId: string) {
    const ctx = currentTenant();
    const rows = await this.db.publicQuery<any>(
      `SELECT u.id, u.email, u.name, tu.role
         FROM public.users u
         JOIN public.tenant_users tu ON tu.user_id = u.id
        WHERE u.id = $1 AND tu.tenant_id = $2`,
      [userId, ctx.tenantId],
    );
    return rows[0];
  }

  async changePassword(userId: string, newPassword: string) {
    const hash = await bcrypt.hash(newPassword, 10);
    await this.db.publicQuery(
      `UPDATE public.users SET password_hash = $1 WHERE id = $2`,
      [hash, userId],
    );
    return { success: true };
  }
}

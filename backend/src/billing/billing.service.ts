import { ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { currentTenant } from '../common/tenant-context';
import { PLANS, PlanName } from './plans';

/**
 * Enforces SaaS plan limits. Every "create resource" path calls one of the
 * `assertCan*` methods BEFORE inserting into the tenant schema.
 */
@Injectable()
export class BillingService {
  constructor(private readonly db: DatabaseService) {}

  async getSubscription() {
    const ctx = currentTenant();
    const rows = await this.db.publicQuery<any>(
      `SELECT plan, max_users, max_projects, api_limit, storage_mb
         FROM public.subscriptions WHERE tenant_id = $1`,
      [ctx.tenantId],
    );
    return rows[0];
  }

  async usage() {
    const ctx = currentTenant();
    const sub = await this.getSubscription();
    const [proj] = await this.db.tenantQuery<{ n: number }>(
      `SELECT count(*)::int AS n FROM projects`,
    );
    const [usr] = await this.db.publicQuery<{ n: number }>(
      `SELECT count(*)::int AS n FROM public.tenant_users WHERE tenant_id=$1`,
      [ctx.tenantId],
    );
    const [storage] = await this.db.tenantQuery<{ used: number }>(
      `SELECT COALESCE(SUM(size_mb),0)::int AS used FROM resources`,
    );
    return {
      plan: sub.plan,
      limits: sub,
      used: { projects: proj.n, users: usr.n, storage_mb: storage.used },
    };
  }

  async assertCanAddProject() {
    const u = await this.usage();
    if (u.used.projects >= u.limits.max_projects) {
      throw new ForbiddenException(
        `Plan limit reached: ${u.limits.max_projects} projects on plan "${u.plan}". Upgrade to add more.`,
      );
    }
  }

  async assertCanAddUser() {
    const u = await this.usage();
    if (u.used.users >= u.limits.max_users) {
      throw new ForbiddenException(
        `Plan limit reached: ${u.limits.max_users} users on plan "${u.plan}". Upgrade to add more.`,
      );
    }
  }

  async changePlan(plan: PlanName) {
    const ctx = currentTenant();
    if (!PLANS[plan]) throw new ForbiddenException('Unknown plan');
    const lim = PLANS[plan];

    // Check if current usage exceeds new plan limits
    const u = await this.usage();
    if (u.used.projects > lim.max_projects) {
      throw new ForbiddenException(
        `Yeni plan limiti (${lim.max_projects} proje) aşıldı. Lütfen önce projelerinizi silerek sayıyı düşürün.`,
      );
    }
    if (u.used.users > lim.max_users) {
      throw new ForbiddenException(
        `Yeni plan limiti (${lim.max_users} kullanıcı) aşıldı. Lütfen önce kullanıcı sayısını düşürün.`,
      );
    }

    await this.db.publicQuery(
      `UPDATE public.subscriptions
          SET plan=$2, max_users=$3, max_projects=$4, api_limit=$5, storage_mb=$6, updated_at=now()
        WHERE tenant_id=$1`,
      [ctx.tenantId, plan, lim.max_users, lim.max_projects, lim.api_limit, lim.storage_mb],
    );
    return this.getSubscription();
  }

  listPlans() { return PLANS; }
}

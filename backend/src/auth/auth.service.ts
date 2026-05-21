import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';
import { TenantContext } from '../common/tenant-context';

export interface JwtPayload {
  sub: string;        // public.users.id
  email: string;
  tenantId: string;   // tenant the token is bound to
  tenantSlug: string;
  role: 'admin' | 'member';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Login is *tenant-scoped*. The same email can exist in multiple tenants;
   * the issued JWT is bound to ONE (user, tenant) pair so a token from
   * TatvanTV cannot be replayed against AhlatTV.
   */
  async login(email: string, password: string, tenant: TenantContext) {
    const users = await this.db.publicQuery<any>(
      `SELECT u.id, u.email, u.password_hash, u.name, tu.role
         FROM public.users u
         JOIN public.tenant_users tu ON tu.user_id = u.id
        WHERE u.email = $1 AND tu.tenant_id = $2`,
      [email, tenant.tenantId],
    );
    if (users.length === 0) throw new UnauthorizedException('Invalid credentials');
    const u = users[0];
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload: JwtPayload = {
      sub: u.id,
      email: u.email,
      tenantId: tenant.tenantId,
      tenantSlug: tenant.slug,
      role: u.role,
    };
    return {
      accessToken: this.jwt.sign(payload),
      user: { id: u.id, email: u.email, name: u.name, role: u.role },
      tenant: { slug: tenant.slug, plan: tenant.plan },
    };
  }

  /**
   * Cross-tenant guard. Called from JwtStrategy: rejects any request where
   * the JWT's tenantId does not match the tenant resolved from the host.
   * THIS is the primary security boundary against a stolen-token replay
   * across tenants.
   */
  assertTokenMatchesTenant(payload: JwtPayload, tenant: TenantContext) {
    if (payload.tenantId !== tenant.tenantId) {
      throw new ForbiddenException(
        'Token tenant mismatch — cross-tenant access blocked',
      );
    }
  }
}

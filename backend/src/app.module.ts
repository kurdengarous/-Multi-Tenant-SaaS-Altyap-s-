import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { BillingModule } from './billing/billing.module';
import { ProjectsModule } from './projects/projects.module';
import { TenantMiddleware } from './middleware/tenant.middleware';

/**
 * Root application module.
 *
 * Architecture notes:
 *  - DatabaseModule exposes a single pg Pool used both for the public schema
 *    (tenants/users/subscriptions) and tenant schemas (projects/usage_logs).
 *  - TenantMiddleware runs on every /api/* request, extracts the tenant from
 *    the subdomain (or X-Tenant header for local dev), validates it, and
 *    attaches a TenantContext to the request via AsyncLocalStorage so
 *    downstream services can run queries against the correct schema.
 */
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    BillingModule,
    ProjectsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant resolution to every request. Auth endpoints are tenant-aware
    // too: a user logs in *into* a tenant.
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}

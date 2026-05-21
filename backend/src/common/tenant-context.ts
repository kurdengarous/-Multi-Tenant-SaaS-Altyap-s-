import { AsyncLocalStorage } from 'async_hooks';

/**
 * Per-request tenant context carried through async call chains.
 *
 * Why AsyncLocalStorage?
 *  - Avoids threading `tenant` through every service signature.
 *  - Guarantees a service called deep in the stack still sees the tenant
 *    that was resolved by TenantMiddleware for *this* HTTP request.
 *  - Concurrent requests for different tenants are perfectly isolated
 *    because each lives in its own async context.
 */
export interface TenantContext {
  tenantId: string;       // public.tenants.id (uuid)
  slug: string;           // 'tatvantv' | 'ahlattv' | 'norsintv'
  schema: string;         // postgres schema name = slug (sanitized)
  plan: 'starter' | 'pro' | 'enterprise';
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function currentTenant(): TenantContext {
  const ctx = tenantStorage.getStore();
  if (!ctx) {
    // SECURITY: refuse to run tenant-scoped queries without context.
    throw new Error('Tenant context missing. Did TenantMiddleware run?');
  }
  return ctx;
}

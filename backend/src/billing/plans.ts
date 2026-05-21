/**
 * SaaS plan catalogue.
 * Limits enforced by BillingService before resource creation.
 */
export type PlanName = 'starter' | 'pro' | 'enterprise';

export interface PlanLimits {
  max_users: number;
  max_projects: number;
  api_limit: number;   // requests / day
  storage_mb: number;
}

export const PLANS: Record<PlanName, PlanLimits> = {
  starter:    { max_users: 3,  max_projects: 50,  api_limit: 1_000,   storage_mb: 100 },
  pro:        { max_users: 25, max_projects: 150, api_limit: 100_000, storage_mb: 10_240 },
  enterprise: { max_users: 1000, max_projects: 1000, api_limit: 10_000_000, storage_mb: 1_048_576 },
};

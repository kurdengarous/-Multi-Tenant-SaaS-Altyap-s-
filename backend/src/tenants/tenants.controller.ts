import { Controller, Get, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class TenantsController {
  constructor(private readonly svc: TenantsService) {}

  /** Root: friendly welcome message to avoid 404 on /api */
  @Get()
  root() {
    return {
      message: 'SaaS Backend is running',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        tenants: '/api/tenants',
      },
    };
  }

  /** Public: list of all tenants for the workspace selector. */
  @Get('tenants')
  list() { return this.svc.listAll(); }

  /** Health check, also reports if a tenant was resolved. */
  @Get('health')
  health() { return { ok: true }; }

  @UseGuards(JwtAuthGuard)
  @Get('me/tenant')
  current() { return this.svc.currentInfo(); }

  @UseGuards(JwtAuthGuard)
  @Get('me/dashboard')
  dashboard() { return this.svc.dashboard(); }
}

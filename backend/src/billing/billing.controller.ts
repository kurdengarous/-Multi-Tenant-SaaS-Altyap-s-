import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlanName } from './plans';

@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly svc: BillingService) {}

  @Get('plans')         plans()        { return this.svc.listPlans(); }
  @Get('subscription')  subscription() { return this.svc.getSubscription(); }
  @Get('usage')         usage()        { return this.svc.usage(); }

  @Post('change-plan')
  change(@Body() b: { plan: PlanName }) { return this.svc.changePlan(b.plan); }
}

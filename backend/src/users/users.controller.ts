import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Get() list() { return this.svc.list(); }

  @Post()
  invite(@Body() b: { email: string; name: string; role: 'admin' | 'member' }, @Req() req: any) {
    return this.svc.invite(b.email, b.name, b.role || 'member', req.user.role);
  }
}

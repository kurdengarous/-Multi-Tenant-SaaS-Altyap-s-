import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Get() list() { return this.svc.list(); }

  @Post()
  invite(@Body() b: { email: string; name: string; role: 'admin' | 'member'; password?: string }, @Req() req: any) {
    return this.svc.invite(b.email, b.name, b.role || 'member', b.password, req.user.role);
  }

  @Get('me')
  getMe(@Req() req: any) {
    return this.svc.getProfile(req.user.sub);
  }

  @Post('change-password')
  changePassword(@Body() b: { password?: string }, @Req() req: any) {
    if (!b.password) throw new Error('Password required');
    return this.svc.changePassword(req.user.sub, b.password);
  }
}

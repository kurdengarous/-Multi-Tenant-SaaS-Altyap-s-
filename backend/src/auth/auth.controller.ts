import { Body, Controller, Post, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

class LoginDto {
  email!: string;
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const tenant = (req as any).tenant;
    if (!tenant) throw new BadRequestException('Tenant not specified (use subdomain or X-Tenant header)');
    if (!dto?.email || !dto?.password) throw new BadRequestException('email and password required');
    return this.auth.login(dto.email, dto.password, tenant);
  }
}

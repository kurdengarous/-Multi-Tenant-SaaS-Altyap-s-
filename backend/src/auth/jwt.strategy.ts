import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService, JwtPayload } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly auth: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
      passReqToCallback: true,
    });
  }

  /**
   * Runs after token signature/expiry validation. We additionally enforce
   * that the token's tenant matches the request's resolved tenant. This is
   * the line that prevents a TatvanTV token from working against AhlatTV.
   */
  async validate(req: Request, payload: JwtPayload) {
    const tenant = (req as any).tenant;
    if (!tenant) throw new UnauthorizedException('No tenant on request');
    this.auth.assertTokenMatchesTenant(payload, tenant);
    return payload;
  }
}

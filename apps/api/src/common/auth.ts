import { CanActivate, createParamDecorator, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.module';

export interface AuthUser { id: string; email: string; role: Role }

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
export const CurrentUser = createParamDecorator((_d: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user);

/** Access token: httpOnly cookie `at` yoki Authorization: Bearer. Har so'rovda foydalanuvchi bloklanmaganligi tekshiriladi. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService, private db: PrismaService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const bearer = (req.headers.authorization as string | undefined)?.replace(/^Bearer\s+/i, '');
    const token = req.cookies?.at ?? bearer;
    if (!token) throw new UnauthorizedException();
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_ACCESS_SECRET });
    } catch {
      throw new UnauthorizedException();
    }
    const u = await this.db.user.findUnique({ where: { id: payload.sub } });
    if (!u || u.blockedAt || !u.emailVerifiedAt) throw new UnauthorizedException();
    req.user = { id: u.id, email: u.email, role: u.role } satisfies AuthUser;
    return true;
  }
}

/** RBAC backendda: ADMIN yo'llari frontend yashirishiga emas, shu guardga tayanadi. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>('roles', [ctx.getHandler(), ctx.getClass()]);
    if (!roles?.length) return true;
    const user = ctx.switchToHttp().getRequest().user as AuthUser | undefined;
    if (!user || !roles.includes(user.role)) throw new ForbiddenException();
    return true;
  }
}

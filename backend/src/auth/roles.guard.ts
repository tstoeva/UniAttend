import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

// Декоратор @Roles(...) – кои роли имат достъп
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// Пропуска заявката само ако ролята от токена е разрешена (иначе 403)
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!roles?.length) return true;
    const user = context.switchToHttp().getRequest().user;
    if (!user || !roles.includes(user.role)) throw new ForbiddenException('Insufficient role');
    return true;
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUEST_USER_KEY, ROLES_KEY } from 'src/constants/auth.constants';
import { UserRole } from 'src/module/users/enum/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    console.log(user);

    if (!user || !user.role) {
      throw new ForbiddenException('Không xác định được vai trò người dùng');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Không có quyền truy cập');
    }

    return true;
  }
}

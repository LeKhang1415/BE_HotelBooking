import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessTokenGuard } from './access-token.guard';
import { AuthType } from 'src/module/auth/enums/auth-type.enum';
import { AUTH_TYPE_KEY } from 'src/constants/auth.constants';
import { RolesGuard } from './roles.guard';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  // Giá trị xác thực mặc định nếu không được chỉ định ở handler/controller
  private static readonly defaultAuthType = AuthType.Bearer;

  // Bản đồ ánh xạ loại xác thực => Guard tương ứng
  private readonly authTypeGuardMap: Record<
    AuthType,
    CanActivate | CanActivate[]
  >;

  constructor(
    // Để đọc metadata từ controller/handler
    private readonly reflector: Reflector,

    // Guard xác thực bằng Bearer token
    private readonly accessTokenGuard: AccessTokenGuard,

    // Guard xác thực Role
    private readonly rolesGuard: RolesGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthType.Bearer]: [this.accessTokenGuard, this.rolesGuard],
      [AuthType.None]: { canActivate: () => true }, // Không yêu cầu xác thực
    };
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Lấy auth type từ metadata
    const authTypes = this.reflector.getAllAndOverride<AuthType[]>(
      AUTH_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? [AuthenticationGuard.defaultAuthType];
    // Lấy tất cả guard tương ứng với các loại xác thực đã được chỉ định
    const guardOrGuards = authTypes
      .map((type) => this.authTypeGuardMap[type])
      .flat(); // Nếu có nhiều guard cho 1 loại thì "dẹp" chúng ra cùng 1 mảng

    for (const instance of guardOrGuards) {
      const canActivate = await Promise.resolve(
        instance.canActivate(context), // Gọi guard đó với context hiện tại
      ).catch((err) => console.error(err)); // Log lỗi nếu có

      if (!canActivate) {
        return false; // Có guard từ chối => ngừng luôn
      }
    }

    return true; // Tất cả guard đều pass
  }
}

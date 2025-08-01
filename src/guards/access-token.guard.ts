import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IncomingHttpHeaders } from 'http';
import jwtConfig from 'src/config/jwt.config';
import { REQUEST_USER_KEY } from 'src/constants/auth.constants';
import { JwtPayload } from 'src/module/auth/interfaces/jwt-payload.interface';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,

    // Inject JWTConfig
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractTokenFromHeader(request.headers);

    if (!token) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    try {
      // Payload duoc truyen vao body de co the su dung trong controller neu can
      request[REQUEST_USER_KEY] = this.jwtService.verify<JwtPayload>(
        token,
        this.jwtConfiguration,
      );
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
    return true;
  }

  private extractTokenFromHeader(
    headers: IncomingHttpHeaders,
  ): string | undefined {
    const authHeader = headers.authorization || headers.Authorization;
    if (!authHeader || Array.isArray(authHeader)) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}

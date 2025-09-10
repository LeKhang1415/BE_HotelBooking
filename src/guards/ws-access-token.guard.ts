import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { REQUEST_USER_KEY } from 'src/constants/auth.constants';
import { JwtPayload } from 'src/module/auth/interfaces/jwt-payload.interface';
import { ConfigType } from '@nestjs/config';
import jwtConfig from 'src/config/jwt.config';

@Injectable()
export class WsAccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();

    const token =
      client.handshake.auth?.token ||
      this.extractTokenFromHandshake(client) ||
      this.extractTokenFromHeader(client);

    if (!token) {
      throw new UnauthorizedException('Token WebSocket không hợp lệ');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(
        token,
        this.jwtConfiguration,
      );
      (client as any)[REQUEST_USER_KEY] = payload;
    } catch (error) {
      throw new UnauthorizedException('Token WebSocket không hợp lệ');
    }

    return true;
  }

  private extractTokenFromHandshake(client: Socket): string | undefined {
    return client.handshake?.query?.token as string | undefined;
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const authHeader =
      client.handshake.headers.authorization ||
      client.handshake.headers.Authorization;

    if (!authHeader || Array.isArray(authHeader)) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}

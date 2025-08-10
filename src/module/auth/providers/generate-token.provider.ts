import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import jwtConfig from 'src/config/jwt.config';
import { User } from 'src/module/users/entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Response } from 'express';

@Injectable()
export class GenerateTokenProvider {
  constructor(
    private readonly jwtService: JwtService,

    // Inject JWTConfig
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  public async signToken<T>(userId: string, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn: expiresIn,
      },
    );
  }

  public async generateToken(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Tạo đồng thời accessToken và refreshToken bằng Promise.all để tối ưu tốc độ
    const [accessToken, refreshToken] = await Promise.all([
      // Tạo accessToken với payload có chứa email (dạng Partial để không cần đủ ActiveUserInterface)
      this.signToken<Partial<JwtPayload>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        {
          email: user.email,
          role: user.role,
        },
      ),

      // Tạo refreshToken không cần payload
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl),
    ]);

    // Trả về object chứa cả accessToken và refreshToken
    return {
      accessToken,
      refreshToken,
    };
  }

  // Phương thức generate token và set refreshToken vào cookie
  public async generateTokenWithCookie(
    user: User,
    response: Response,
  ): Promise<{ accessToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<JwtPayload>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        {
          email: user.email,
          role: user.role,
        },
      ),

      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl),
    ]);

    // Set refreshToken vào cookie
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true, // Chỉ server mới có thể đọc được cookie
      sameSite: 'strict', // Bảo vệ chống CSRF
      maxAge: this.jwtConfiguration.refreshTokenTtl * 1000, // Convert giây sang millisecond
      path: '/', // Cookie có hiệu lực trên toàn bộ domain
    });

    // Chỉ trả về accessToken, refreshToken được lưu trong cookie
    return {
      accessToken,
    };
  }

  // Phương thức để clear refresh token cookie khi logout
  public clearRefreshTokenCookie(response: Response): void {
    response.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });
  }
}

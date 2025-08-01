import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import jwtConfig from 'src/config/jwt.config';
import { User } from 'src/module/users/entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

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
}

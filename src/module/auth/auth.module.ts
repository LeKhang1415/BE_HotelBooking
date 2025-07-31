import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { HashingProvider } from './providers/hashing.provider';
import { BcryptProvider } from './providers/bcrypt.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from 'src/config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { GenerateTokenProvider } from './providers/generate-token.provider';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: HashingProvider,
      useClass: BcryptProvider,
    },
    GenerateTokenProvider,
  ],
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => UsersModule),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  exports: [AuthService, HashingProvider],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingModule } from './booking/booking.module';
import { ReviewModule } from './reviews/reviews.module';
import { RoomModule } from './room/room.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TypeRoomModule } from './type-room/type-room.module';

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        //entities: [User],
        synchronize: configService.get('database.synchronize'),
        port: configService.get('database.port'),
        username: configService.get('database.user'),
        password: configService.get('database.password'),
        host: configService.get('database.host'),
        autoLoadEntities: configService.get('database.autoLoadEntities'),
        database: configService.get('database.name'),
      }),
    }),
    BookingModule,
    ReviewModule,
    RoomModule,
    AuthModule,
    TypeRoomModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersController } from './api/users.controller';
import { UsersService } from './application/users.service';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { AuthController } from './api/auth.controller'
import { UsersExternalQueryRepository } from './infrastructure/external-query/users.external-query-repository';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthService } from './application/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './guards/bearer/jwt.startegy';
import { CryptoService } from './application/crypto.service';
import { SecurityDevicesRepository } from './infrastructure/security-devices.repository';
import { SecurityDevicesService } from './application/security-device.service';
import { RefreshTokenSessionsRepository } from './infrastructure/refresh-token-sessions.repository';
import { RefreshTokenStrategy } from './guards/refresh/refresh-token.strategy';
import { SecurityDevicesController } from './api/security-devices.controller';
import { SaUsersController } from './api/sa-users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/user.entity';
import { RefreshTokenSession } from './domain/refresh-token.entity';
import { SecurityDevice } from './domain/security-devices.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshTokenSession, SecurityDevice]),
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('AC_SECRET') || 'access-token-secret',
        signOptions: { 
          expiresIn: configService.get<string>('AC_TIME') ? `${configService.get<string>('AC_TIME')}s` : '10s'
        },
      }),
    }),
  ],
  controllers: [UsersController, AuthController, SecurityDevicesController, SaUsersController],
  providers: [
    UsersService,
    UsersRepository,
    UsersQueryRepository,
    AuthService,
    JwtStrategy,
    RefreshTokenStrategy,
    CryptoService,
    UsersExternalQueryRepository,
    SecurityDevicesRepository,
    SecurityDevicesService,
    RefreshTokenSessionsRepository
  ],
  exports: [UsersExternalQueryRepository, JwtModule],
})
export class UserAccountsModule {}
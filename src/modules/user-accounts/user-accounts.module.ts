import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersController } from './api/users.controller';
import { UsersService } from './application/users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { AuthController } from './api/auth.controller';
import { AuthQueryRepository } from './infrastructure/query/auth.query-repository';
import { UsersExternalQueryRepository } from './infrastructure/external-query/users.external-query-repository';
import { UsersExternalService } from './application/users.external-service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthService } from './application/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './guards/bearer/jwt.startegy';
import { CryptoService } from './application/crypto.service';
import { SecurityDevicesRepository } from './infrastructure/security-devices.repository';
import { SecurityDevicesService } from './application/security-device.service';
import { RefreshTokenSessionsRepository } from './infrastructure/refresh-token-sessions.repository';
import { RefreshTokenSession, RefreshTokenSessionSchema } from './domain/refresh-token.entity';
import { SecurityDevice, SecurityDeviceSchema } from './domain/security-devices.entity';
import { RefreshTokenStrategy } from './guards/refresh/refresh-token.strategy';
import { SecurityDevicesController } from './api/security-devices.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: RefreshTokenSession.name, schema: RefreshTokenSessionSchema}]),
    MongooseModule.forFeature([{ name: SecurityDevice.name, schema: SecurityDeviceSchema}]),
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
  controllers: [UsersController, AuthController, SecurityDevicesController],
  providers: [
    UsersService,
    UsersRepository,
    UsersQueryRepository,
    AuthQueryRepository,
    AuthService,
    JwtStrategy,
    RefreshTokenStrategy,
    CryptoService,
    UsersExternalQueryRepository,
    UsersExternalService,
    SecurityDevicesRepository,
    SecurityDevicesService,
    RefreshTokenSessionsRepository,
  ],
  exports: [UsersExternalQueryRepository, UsersExternalService, JwtModule],
})
export class UserAccountsModule {}
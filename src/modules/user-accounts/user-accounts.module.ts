import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersController } from './api/users.controller';
import { UsersService } from './application/users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { AuthController } from './api/auth.controller';
import { SecurityDevicesQueryRepository } from './infrastructure/query/security-devices.query-repository';
import { AuthQueryRepository } from './infrastructure/query/auth.query-repository';
import { SecurityDevicesController } from './api/security-devices.controller';
import { UsersExternalQueryRepository } from './infrastructure/external-query/users.external-query-repository';
import { UsersExternalService } from './application/users.external-service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthService } from './application/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './guards/bearer/jwt.startegy';
import { CryptoService } from './application/crypto.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('AC_SECRET') || 'access-token-secret',
        signOptions: { 
          expiresIn: configService.get<string>('AC_TIME') ? `${configService.get<string>('AC_TIME')}m` : '5m'
        },
      }),
    }),
  ],
  controllers: [UsersController, AuthController, SecurityDevicesController],
  providers: [
    UsersService,
    UsersRepository,
    UsersQueryRepository,
    SecurityDevicesQueryRepository,
    AuthQueryRepository,
    AuthService,
    JwtStrategy,
    CryptoService,
    UsersExternalQueryRepository,
    UsersExternalService,
  ],
  exports: [UsersExternalQueryRepository, UsersExternalService, JwtModule],
})
export class UserAccountsModule {}
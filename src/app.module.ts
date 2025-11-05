import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { CoreModule } from './core/core.module';
import { TestingModule } from './modules/testing/testing.module';
import { BloggersPlatformModule } from './modules/blogger-platform/blogger-platform.module';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the ConfigModule available throughout the app
      envFilePath: '.env', // Specify the path to your .env file
    }),
    // ThrottlerModule.forRoot([{
    //   ttl: 10000, // 10 seconds in milliseconds
    //   limit: 5, // 5 requests per TTL window
    // }]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: true,
      autoLoadEntities: true,
      synchronize: false
    }),
    CqrsModule.forRoot(),
    UserAccountsModule,
    TestingModule,
    BloggersPlatformModule,
    CoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

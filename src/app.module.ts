import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { CoreModule } from './core/core.module';
import { TestingModule } from './modules/testing/testing.module';
import { BloggersPlatformModule } from './modules/blogger-platform/blogger-platform.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://kadetigor3216:yxqFwxLKJaQKAlqG@mycluster.o5wevkr.mongodb.net/'),
    UserAccountsModule,
    TestingModule,
    BloggersPlatformModule,
    CoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}

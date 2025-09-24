import { forwardRef, Module } from '@nestjs/common';
import { PostsService } from './application/posts.service';
import { PostsController } from './api/posts.controller';
import { PostsRepository } from './infrastructure/posts.repository';
import { PostsQueryRepository } from './infrastructure/query/posts.query-repository';
import { Post } from './domain/post.entity';
import { BlogsModule } from '../blogs/blogs.module';
import { PostsExternalQueryRepository } from './infrastructure/external-query/posts.external-query-repository';
import { PostsExternalService } from './application/posts.external-service';
import { UserAccountsModule } from 'src/modules/user-accounts/user-accounts.module';
import { DatabaseModule } from 'src/modules/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => BlogsModule),
    UserAccountsModule
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    PostsRepository,
    PostsQueryRepository,
    PostsExternalQueryRepository,
    PostsExternalService
  ],
  exports: [PostsExternalQueryRepository, PostsExternalService],
})
export class PostsModule { }

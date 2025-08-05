import { forwardRef, Module } from '@nestjs/common';
import { PostsService } from './application/posts.service';
import { PostsController } from './api/posts.controller';
import { PostsRepository } from './infrastructure/posts.repository';
import { PostsQueryRepository } from './infrastructure/query/posts.query-repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './domain/post.entity';
import { BlogsModule } from '../blogs/blogs.module';
import { PostsExternalQueryRepository } from './infrastructure/external-query/posts.external-query-repository';
import { PostsExternalService } from './application/posts.external-service';
import { CommentsModule } from '../comments/comments.module';
import { UserAccountsModule } from 'src/modules/user-accounts/user-accounts.module';
import { PostLikeRepository } from './infrastructure/posts-likes.repository';
import { PostLike, PostLikeSchema } from './domain/post-like.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }, { name: PostLike.name, schema: PostLikeSchema }]),
    forwardRef(() => BlogsModule),
    CommentsModule,
    UserAccountsModule
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    PostsRepository,
    PostsQueryRepository,
    PostsExternalQueryRepository,
    PostsExternalService,
    PostLikeRepository
  ],
  exports: [PostsExternalQueryRepository, PostsExternalService],
})
export class PostsModule { }

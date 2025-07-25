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

@Module({
  imports: [
          MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
          forwardRef(() => BlogsModule),
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
export class PostsModule {}

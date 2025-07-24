import { Module } from '@nestjs/common';
import { PostsService } from './application/posts.service';
import { PostsController } from './api/posts.controller';
import { PostsRepository } from './infrastructure/posts.repository';
import { PostsQueryRepository } from './infrastructure/query/posts.query-repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './domain/post.entity';
import { BlogsExternalQueryRepository } from '../blogs/infrastructure/external-query/blogs.external-query-repository';
import { BlogsModule } from '../blogs/blogs.module';

@Module({
  imports: [
          MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
          BlogsModule,
      ],
  controllers: [PostsController],
  providers: [
    PostsService,
    PostsRepository,
    PostsQueryRepository,
    BlogsExternalQueryRepository
  ],
  exports: [],
})
export class PostsModule {}

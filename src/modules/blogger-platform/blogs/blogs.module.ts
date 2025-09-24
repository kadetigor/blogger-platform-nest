import { forwardRef, Module } from '@nestjs/common';
import { BlogsRepository } from './infrastructure/blogs.repository';
import { BlogsService } from './application/blogs.service';
import { BlogsQueryRepository } from './infrastructure/query/blogs.query-repository';
import { Blog } from './domain/blog.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogsController } from './api/blogs.controller';
import { SaBlogsController } from './api/sa-blogs.controller';
import { BlogsExternalQueryRepository } from './infrastructure/external-query/blogs.external-query-repository';
import { PostsModule } from '../posts/posts.module';
import { DatabaseModule } from 'src/modules/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => PostsModule),
  ],
  controllers: [BlogsController, SaBlogsController],
  providers: [
    BlogsRepository,
    BlogsQueryRepository,
    BlogsService,
    BlogsExternalQueryRepository,
  ],
  exports: [BlogsExternalQueryRepository],
})
export class BlogsModule {}

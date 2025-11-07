import { Module } from '@nestjs/common';
import { BlogsModule } from './blogs/blogs.module';
import { PostsModule } from './posts/posts.module';
import { QuizModule } from '../quiz/quiz.module';

@Module({
  imports: [BlogsModule, PostsModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class BloggersPlatformModule {}

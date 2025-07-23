import { Module } from "@nestjs/common";
import { BlogsModule } from "./blogs/blogs.module";
import { PostsModule } from './posts/posts.module';

@Module({
    imports: [
        BlogsModule,
        PostsModule
    ],
    controllers: [],
    providers: [],
    exports: [],
})

export class BloggersPlatformModule {}
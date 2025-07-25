import { Module } from "@nestjs/common";
import { BlogsRepository } from "./infrastructure/blogs.repository";
import { BlogsService } from "./application/blogs.service";
import { BlogsQueryRepository } from "./infrastructure/query/blogs.query-repository";
import { Blog, BlogSchema } from "./domain/blog.entity";
import { MongooseModule } from "@nestjs/mongoose";
import { BlogsController } from "./api/blogs.controller";
import { BlogsExternalQueryRepository } from "./infrastructure/external-query/blogs.external-query-repository";
import { PostsModule } from "../posts/posts.module";

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
        PostsModule,
    ],
    controllers: [BlogsController],
    providers: [
        BlogsRepository,
        BlogsQueryRepository,
        BlogsService,
        BlogsExternalQueryRepository
    ],
    exports: [BlogsExternalQueryRepository],
})

export class BlogsModule {}
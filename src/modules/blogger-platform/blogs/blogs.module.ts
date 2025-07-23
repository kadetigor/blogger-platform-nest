import { Module } from "@nestjs/common";
import { BlogsRepository } from "./infrastructure/blogs.repository";
import { BlogsService } from "./application/blogs.service";
import { BlogsQueryRepository } from "./infrastructure/query/blogs.query-repository";
import { Blog, BlogSchema } from "./domain/blog.entity";
import { MongooseModule } from "@nestjs/mongoose";
import { BlogsController } from "./api/blogs.controller";

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    ],
    controllers: [BlogsController],
    providers: [
        BlogsRepository,
        BlogsQueryRepository,
        BlogsService,
    ],
    exports: [],
})

export class BlogsModule {}
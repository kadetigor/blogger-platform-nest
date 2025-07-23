import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Blog, BlogModelType } from "../domain/blog.entity";
import { BlogsRepository } from "../infrastructure/blogs.repository";


@Injectable()
export class BlogsExternalService {

    constructor(
        @InjectModel(Blog.name)
        private BlogModel: BlogModelType,
        private blogsRepository: BlogsRepository,
    ) {}
}
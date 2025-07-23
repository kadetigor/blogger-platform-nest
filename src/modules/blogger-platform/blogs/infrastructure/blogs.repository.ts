import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Blog, BlogDocument, BlogModelType } from "../domain/blog.entity";
import { UpdateBlogDto } from "../dto/create-blog.dto";


@Injectable()
export class BlogsRepository {
    
    constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}

    async findById(id: string): Promise<BlogDocument | null> {
        return this.BlogModel.findOne({
            _id: id,
            deletedAt: null,
        })
    }

    async save(blog: BlogDocument) {
        await blog.save()
    }

    async create(newBlog: Blog): Promise<string> {
        const blog = new this.BlogModel(newBlog);
        const savedBlog = await blog.save();
        return savedBlog._id.toString();
    }

    async update(id: string, dto: UpdateBlogDto): Promise<BlogDocument> {
        const result = await this.BlogModel.findByIdAndUpdate(
            id,
            {
                name: dto.name,
                description: dto.description,
                websiteUrl: dto.websiteUrl
            },
            { runValidators: true }
        );

        if (!result) {
            throw new NotFoundException('Blog does not exist');
        }

        return result
    }

    async delete(id: string): Promise<void> {
        const result = await this.BlogModel.findByIdAndUpdate(
            id,
            {
                deletedAt: new Date()
            },
        );

        if (!result) {
            throw new NotFoundException('Blog does not exist');
        }
    }
}
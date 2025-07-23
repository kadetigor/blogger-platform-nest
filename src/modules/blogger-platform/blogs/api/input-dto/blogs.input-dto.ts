import { CreateBlogDto } from "../../dto/create-blog.dto";

export class CreateBlogInputDto implements CreateBlogDto {
    name: string;
    description: string;
    websiteUrl: string;
}
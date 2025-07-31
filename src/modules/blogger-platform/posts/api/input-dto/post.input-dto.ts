import { CreatePostDto } from '../../dto/create-post.dto';

export class CreatePostInputDto extends CreatePostDto {
  blogId: string;
}

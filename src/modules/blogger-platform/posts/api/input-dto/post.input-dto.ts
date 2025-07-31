// src/modules/blogger-platform/posts/api/input-dto/post.input-dto.ts
import { IsString, Length, IsMongoId } from 'class-validator';
import { CreatePostDto } from '../../dto/create-post.dto';
import { Trim } from '../../../../../core/decorators/transform/trim';

export class CreatePostInputDto extends CreatePostDto {

  @IsString()
  @IsMongoId()
  blogId: string;
}

// Also create an UpdatePostInputDto for PUT requests
export class UpdatePostInputDto {
  @Trim()
  @IsString()
  @Length(1, 30)
  title: string;

  @Trim()
  @IsString()
  @Length(1, 100)
  shortDescription: string;

  @Trim()
  @IsString()
  @Length(1, 1000)
  content: string;
}
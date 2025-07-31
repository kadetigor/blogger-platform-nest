import { IsString, IsUrl, Length, Matches } from 'class-validator';
import { CreateBlogDto } from '../../dto/create-blog.dto';
import { Trim } from '../../../../../core/decorators/transform/trim';

export class CreateBlogInputDto implements CreateBlogDto {
  @Trim()
  @IsString()
  @Length(1, 15)
  name: string;

  @Trim()
  @IsString()
  @Length(1, 500)
  description: string;

  @Trim()
  @IsString()
  @Length(1, 100)
  @Matches(/^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/, {
    message: 'websiteUrl must be a valid URL',
  })
  websiteUrl: string;
}
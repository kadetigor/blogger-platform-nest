import { IsString, Length } from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';

export class CreatePostDto {
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

export class UpdatePostDto {
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

import { IsString, Length } from "class-validator";

export class CommentatorInfo {
    @IsString()
    userId: string;

    @IsString()
    userLogin: string;
}

export class CreateCommentDto {
    @IsString()
    @Length(20, 300)
    content: string;

    commentatorInfo: CommentatorInfo;

    @IsString()
    postId: string;
}
import { IsString } from "class-validator";

export enum likeStatus {
    Like = 'Like',
    Dislike = 'Dislike'
}

export class CreateCommentLikeDto {
    @IsString()
    commentId: string;

    @IsString()
    userId: string;

    @IsString()
    status: likeStatus;
}
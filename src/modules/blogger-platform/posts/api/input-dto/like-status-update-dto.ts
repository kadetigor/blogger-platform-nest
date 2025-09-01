import { IsEnum } from "class-validator";

export class LikeStatusUpdateDto {
    @IsEnum(['None', 'Like', 'Dislike'])
    likeStatus: string;
}
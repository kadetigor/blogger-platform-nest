import { CommentLikeDocument } from "../../domain/comment-like.entity";

export class CommentLikeViewDto {
  likesCount: number;
  dislikesCount: number;
  myStatus: "None" | "Like" | "Dislike";
}

import { Module } from "@nestjs/common";
import { CommentsController } from "./api/comments.controller";
import { CommentsLikesRepository } from "./infrastructure/comments-likes.repository";
import { CommentsQueryRepository } from "./infrastructure/query/comments.query-repository";
import { CommentsRepository } from "./infrastructure/comments.repository";
import { CommentsService } from "./application/comments.service";
import { CommentsExtertalService } from "./application/comments.external-service";
import { PostsModule } from "../posts/posts.module";
import { CommentsExternalQueryRepository } from "./infrastructure/external/comments.external-query-repository";
import { MongooseModule } from "@nestjs/mongoose";
import { Comment, CommentSchema } from "./domain/comment.entity";
import { CommentLike, CommentLikeSchema } from "./domain/comment-like.entity";
import { CommentsLikesExternalRepository } from "./infrastructure/external/comments-likes.external-repository";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: CommentLike.name, schema: CommentLikeSchema }
    ]),
  ],
  controllers: [CommentsController],
  providers: [
    CommentsLikesRepository,
    CommentsQueryRepository,
    CommentsRepository,
    CommentsService,
    CommentsExternalQueryRepository,
    CommentsExtertalService,
    CommentsLikesExternalRepository
  ],
  exports: [CommentsExtertalService, CommentsExternalQueryRepository, CommentsLikesExternalRepository]
})
export class CommentsModule { }

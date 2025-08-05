import { Module } from "@nestjs/common";
import { CommentsController } from "./api/comments.controller";
import { CommentsLikesRepository } from "./infrastructure/comments-likes.repository";
import { CommentsQueryRepository } from "./infrastructure/query/comments.query-repository";
import { CommentsRepository } from "./infrastructure/comments.repository";
import { CommentsService } from "./application/comments.service";
import { CommentsExtertalService } from "./application/comments.external-service";

@Module({
  imports: [],
  controllers: [CommentsController],
  providers: [
    CommentsLikesRepository,
    CommentsQueryRepository,
    CommentsRepository,
    CommentsService
  ],
  exports: [CommentsExtertalService]
})
export class CommentsModule { }

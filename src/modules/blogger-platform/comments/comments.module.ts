import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CommentsController } from "./api/comments.controller";
import { CommentsLikesRepository } from "./infrastructure/comments-likes.repository";
import { CommentsQueryRepository } from "./infrastructure/query/comments.query-repository";
import { CommentsRepository } from "./infrastructure/comments.repository";
import { CommentsService } from "./application/comments.service";
import { CommentsExtertalService } from "./application/comments.external-service";
import { CommentsExternalQueryRepository } from "./infrastructure/external/comments.external-query-repository";
import { CommentsLikesExternalRepository } from "./infrastructure/external/comments-likes.external-repository";
import { PostsModule } from "../posts/posts.module";
import { DatabaseModule } from "src/modules/database/database.module";
import { Comment } from "./domain/comment.entity";
import { CommentLike } from "./domain/comment-like.entity";

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Comment, CommentLike]),
    forwardRef(() => PostsModule),
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

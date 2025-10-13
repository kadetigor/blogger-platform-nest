import { forwardRef, Module } from "@nestjs/common";
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

@Module({
  imports: [
    DatabaseModule,
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

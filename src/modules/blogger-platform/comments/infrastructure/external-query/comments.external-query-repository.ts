import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Comment, CommentDocument, CommentModelType } from "../../domain/comment.entity";
import { GetCommentsQueryParams } from "../../api/input-dto.ts/get-comments-query-params.input-dto";
import { CommentViewDto } from "../../api/view-dto.ts/comment.view-dto";
import { PaginatedViewDto } from "src/core/dto/base.paginated.view-dto";
import { FilterQuery } from "mongoose";
import { CommentsLikesRepository } from "../comments-likes.repository";

@Injectable()
export class CommentsExternalQueryRepository {

  constructor(
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
    private commentsLikesRepository: CommentsLikesRepository,
  ) { };

  async getCommentsForPost(postId: string, userId: string, query: GetCommentsQueryParams): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const filter: FilterQuery<Comment> = {
          deletedAt: null,
        };

    const comment = await this.CommentModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.CommentModel.countDocuments(filter);

    const items = comment.map(CommentViewDto.mapToView);

    const likesInfoMap = new Map<string, { likesCount: number; dislikesCount: number; myStatus: "None" | "Like" | "Dislike" }>();
        await Promise.all(
          items.map(async (comment) => {
            const likesInfo = await this.commentsLikesRepository.getLikesInfo(comment._id.toString(), userId);
            likesInfoMap.set(comment._id.toString(), likesInfo);
          })
        );

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
}

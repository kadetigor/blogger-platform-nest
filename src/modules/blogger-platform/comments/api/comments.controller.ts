import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Put, Req } from "@nestjs/common";
import { LikeStatusUpdateDto } from "../dto/update-comment-like.dto";
import { UpdateCommentDto } from "../dto/update-comment.dto";
import { CommentViewDto } from "./view-dto.ts/comment.view-dto";
import { CommentsQueryRepository } from "../infrastructure/query/comments.query-repository";
import { Request } from 'express';
import { REQUEST } from "@nestjs/core";
import { RequestWithUser } from "types/custom-request.interface";
import { CommentsLikesRepository } from "../infrastructure/comments-likes.repository";
import { CommentsService } from "../application/comments.service";

@Controller('comments')
export class CommentsController {
    constructor(
        private readonly commentsService: CommentsService,
        private commentsQueryRepository: CommentsQueryRepository,
        private commentsLikesQueryRepository: CommentsLikesRepository
        @Inject(REQUEST) private request: Request,
    ) {
        console.log('CommentsController created')
    }

    @Put(':commentId/likie-status')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateLikeStatus(
        @Param('commentId') commentId: string,
        @Body() dto: LikeStatusUpdateDto,
    ): Promise<void> {
        const status = dto.likeStatus
        return await this.commentsService.updateLikeStatus(commentId, status)
    }

    @Put(':commentId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateComment(
        @Param('commentId') commentId: string,
        @Body() dto: UpdateCommentDto,
    ): Promise<void> {
        const content = dto.content
        return await this.commentsService.updateComment(commentId, content)
    }

    @Delete(':commentId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteComment(
        @Param('commentId') commentId: string,
    ): Promise<void> {
        return await this.commentsService.removeComment(commentId)
    }

    @Get(':id')
    async findOneComment(
        @Param('id') id: string,
        @Req() req: RequestWithUser
    ):Promise<CommentViewDto> {
        // Getting user infor from the JWT token
        const userId = req.user?.id;
        const comment = await this.commentsQueryRepository.getByIdOrNotFoundFail(id)
        const likeInfo = await this.commentsLikesQueryRepository.getByIdOrNotFoundFail(id, userId)
        const result = CommentViewDto.mapToView(comment, likeInfo)
        return result;
    }
}
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { Comment } from "../../domain/comment.entity";

@Injectable()
export class CommentsQueryRepository {
    constructor(@InjectRepository(Comment) private repository: Repository<Comment>) {}

    async getByIdOrNotFoundFail(id: string): Promise<Comment & { commentatorInfo: { userId: string; userLogin: string } }> {
        const comment = await this.repository.findOne({
            where: {
                id,
                deletedAt: IsNull()
            }
        });

        if (!comment) {
            throw new NotFoundException('comment not found');
        }

        // Map to include commentatorInfo for backward compatibility
        return {
            ...comment,
            commentatorInfo: {
                userId: comment.commentatorUserId,
                userLogin: comment.commentatorUserLogin
            }
        };
    }
}

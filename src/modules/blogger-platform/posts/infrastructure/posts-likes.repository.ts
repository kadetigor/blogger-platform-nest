import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { PostLike, PostLikeModelType } from "../domain/post-like.entity";
import { PipelineStage } from "mongoose";

@Injectable()
export class PostLikeRepository {

    constructor(@InjectModel(PostLike.name) private PostLikeModel: PostLikeModelType){}

    async setLikeStatus(postId: string, userId: string, status: string, userLogin: string): Promise<void> {
        if (status === "None") {
            await this.PostLikeModel.deleteOne({ postId, userId })
            return;
        }

        const result = await this.PostLikeModel.findOneAndUpdate(
            { postId, userId },
            {
                $set: {
                    status,
                    addedAt: new Date(),
                    login: userLogin  // ← YOU'RE MISSING THIS!
                }
            },
            { upsert: true, new: true }  // Also add 'new: true' to see the result
        );
    }

    async getUserLikeStatus(postId: string, userId: string): Promise<"Like" | "Dislike" | "None"> {
        console.log('=== getUserLikeStatus ===');
        console.log('Looking for like with postId:', postId, 'userId:', userId);
        console.log('Type of postId:', typeof postId);
        console.log('Type of userId:', typeof userId);

        const like = await this.PostLikeModel.findOne({ postId, userId });

        console.log('Found like:', like);

        if (!like) {
            console.log('No like found, returning None');
            return "None";
        }

        console.log('Returning status:', like.status);
    
        return like.status as "Like" | "Dislike";
    }

    async getLikesCount(postId: string): Promise<number> {
        return await this.PostLikeModel.countDocuments({ postId, status: "Like" });
    }

    async getDislikesCount(postId: string): Promise<number> {
        return await this.PostLikeModel.countDocuments({ postId, status: "Dislike" });
    }

    async deleteAllLikesForPost(postId: string): Promise<void> {
        await this.PostLikeModel.deleteMany({ postId });
    }

    async findNewestLikes(postId: string): Promise<Array<{
        addedAt: Date;
        userId: string;
        login: string;
    }>> {
        const pipeline: PipelineStage[] = [
            // Match likes for this post
            {
                $match: {
                    postId: postId,
                    status: "Like"
                }
            },
            // Sort by newest first (using addedAt field)
            {
                $sort: { addedAt: -1 }
            },
            // Limit to 3
            {
                $limit: 3
            },
            // Project the final result directly since we already have login in the document
            {
                $project: {
                    _id: 0,
                    addedAt: '$addedAt',
                    userId: '$userId',
                    login: '$login'
                }
            }
        ];

        const result = await this.PostLikeModel.aggregate<{
            addedAt: Date;
            userId: string;
            login: string;
        }>(pipeline);
        
        return result;
    }

    async getExtendedLikesInfo(postId: string, userId?: string): Promise<{
        likesCount: number;
        dislikesCount: number;
        myStatus: "Like" | "Dislike" | "None";
        newestLikes: Array<{ addedAt: Date; userId: string; login: string; }>
    }> {
        const [likesCount, dislikesCount, myStatus, newestLikes] = await Promise.all([
            this.getLikesCount(postId),
            this.getDislikesCount(postId),
            userId ? this.getUserLikeStatus(postId, userId) : Promise.resolve("None" as const),
            this.findNewestLikes(postId),
        ]);

        return {
            likesCount,
            dislikesCount,
            myStatus,
            newestLikes
        };
    }
}
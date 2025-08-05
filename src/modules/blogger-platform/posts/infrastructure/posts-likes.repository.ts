import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { PostLike, PostLikeModelType } from "../domain/post-like.entity";
import { PipelineStage } from "mongoose";

@Injectable()
export class PostLikeRepository {

    constructor(@InjectModel(PostLike.name) private PostLikeModel: PostLikeModelType){}

    async setLikeStatus(postId: string, userId: string, status: string):Promise<void> {
        if (status === "None"){
            await this.PostLikeModel.deleteOne({ postId, userId })
            return;
        }

        await this.PostLikeModel.findOneAndUpdate(
            { postId, userId },

            {
                $set: {
                    status,
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );
    }

    async getUserLikeStatus(postId: string, userId: string): Promise<"Like" | "Dislike" | "None"> {
        const like = await this.PostLikeModel.findOne({ postId, userId });

        if (!like) {
            return "None";
        }
    
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
            // Sort by newest first
            {
                $sort: { createdAt: -1 }
            },
            // Limit to 3
            {
                $limit: 3
            },
            // Join with users collection
            {
                $lookup: {
                    from: 'users',  // MongoDB collection name (usually lowercase plural)
                    let: { userId: '$userId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$_id', { $toObjectId: '$$userId' }]
                                }
                            }
                        },
                        {
                            $project: {
                                login: 1
                            }
                        }
                    ],
                    as: 'user'
                }
            },
            // Unwind the user array (convert from array to object)
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Final projection
            {
                $project: {
                    _id: 0,
                    addedAt: '$createdAt',
                    userId: '$userId',
                    login: { $ifNull: ['$user.login', 'Unknown'] }
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
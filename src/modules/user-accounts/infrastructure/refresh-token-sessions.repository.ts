import { Injectable } from "@nestjs/common";
import { RefreshTokenSession, RefreshTokenSessionDocument, RefreshTokenSessionModelType } from "../domain/refresh-token.entity";
import { InjectModel } from "@nestjs/mongoose";
import { CreateRefreshTokenSessionDto } from "../domain/dto/create-refresh-token-session.dto";

@Injectable()
export class RefreshTokenSessionsRepository {
    constructor(
        @InjectModel(RefreshTokenSession.name)
        private RefreshTokenSessionModel: RefreshTokenSessionModelType,
      ) {}

    async createSession(dto: CreateRefreshTokenSessionDto, refreshTime: number): Promise<void> {
        const session = this.RefreshTokenSessionModel.createInstance(dto, refreshTime)
        await session.save();
    }

    async findSessionByTokenId(tokenId: string): Promise<RefreshTokenSessionDocument | null> {
        return await this.RefreshTokenSessionModel.findOne({ "tokenId": tokenId });
    }

    async invalidateSession(tokenId: string): Promise<boolean> {
        const result = await this.RefreshTokenSessionModel.updateOne(
            { tokenId },
            { $set: { isRevoked: true } }
        );
        return result.modifiedCount > 0;
    }

    async deleteExpiredSessions(): Promise<void> {
        await this.RefreshTokenSessionModel.deleteMany({
            expiresAt: { $lt: new Date() }
        });
    }

    // Add these new methods for device-related operations
    async deleteByDeviceId(deviceId: string): Promise<boolean> {
        const result = await this.RefreshTokenSessionModel.deleteMany({ deviceId });
        return result.deletedCount > 0;
    }

    async deleteAllUserSessionsExceptOne(userId: string, deviceIdToKeep: string): Promise<boolean> {
        const result = await this.RefreshTokenSessionModel.deleteMany({
            userId,
            deviceId: { $ne: deviceIdToKeep }
        });
        return result.deletedCount > 0;
    }

    async findSessionsByUserId(userId: string): Promise<RefreshTokenSession[]> {
        return await this.RefreshTokenSessionModel.find({ userId }).lean();
    }
};
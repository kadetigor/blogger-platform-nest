import { Injectable, NotFoundException } from "@nestjs/common";
import { RefreshTokenSession } from "../domain/refresh-token.entity";
import { CreateRefreshTokenSessionDto } from "../domain/dto/create-refresh-token-session.dto";
import { add } from 'date-fns';
import { Not, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class RefreshTokenSessionsRepository {
    constructor(@InjectRepository(RefreshTokenSession) private repository: Repository<RefreshTokenSession>) {}

    async createSession(dto: CreateRefreshTokenSessionDto, refreshTime: number): Promise<void> {
        const session = this.repository.create({
            userId: dto.userId,
            tokenId: dto.tokenId,
            deviceId: dto.deviceId,
            isRevoked: false,
            expiresAt: new Date(Date.now() + refreshTime * 1000)
        })

        await this.repository.save(session)

        return
    }

    async findSessionByTokenId(tokenId: string): Promise<RefreshTokenSession> {
        const result = await this.repository.find({
            where: {
                tokenId: tokenId
            }
        })

        return result[0];
    }

    async invalidateSession(tokenId: string): Promise<boolean> {
        try {
            const result = await this.repository.update(
                {tokenId: tokenId},
                {
                    isRevoked: true
                }
            )

            return result.affected !== undefined && result.affected > 0;
        } catch (error) {
            return false
        }
    }

    async deleteExpiredSessions(): Promise<void> {
        try {
            await this.repository.softDelete({
                isRevoked: true
            })
        } catch (error) {
            throw new NotFoundException
        }
    }

    // Add these new methods for device-related operations
    async deleteByDeviceId(deviceId: string): Promise<boolean> {
        try {
            const result = await this.repository.softDelete(
                {id: deviceId}
            )

            return result.affected !== undefined && result.affected > 0;
        } catch (error) {
            return false
        }
    }

    async deleteAllUserSessionsExceptOne(userId: string, deviceIdToKeep: string): Promise<boolean> {
        try {
            const result = await this.repository.softDelete(
                {
                    userId: userId,
                    id: Not(deviceIdToKeep)
                },
            )

            return result.affected !== undefined && result.affected > 0;
        } catch (error) {
            return false
        }
    }

    async findSessionsByUserId(userId: string): Promise<RefreshTokenSession[]> {
        const result = await this.repository.find({
            where: {
                userId: userId
            },
            order:{
                expiresAt: "DESC",
            },
        })

        return result;
    }
};
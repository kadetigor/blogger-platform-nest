import { Injectable } from "@nestjs/common";
import { RefreshTokenSession, RefreshTokenSessionDocument } from "../domain/refresh-token.entity";
import { CreateRefreshTokenSessionDto } from "../domain/dto/create-refresh-token-session.dto";
import { DatabaseService } from '../../database/database.service';
import { add } from 'date-fns';

@Injectable()
export class RefreshTokenSessionsRepository {
    constructor(
        private databaseService: DatabaseService,
      ) {}

    // Helper to convert database rows to RefreshTokenSession entities
    private mapToSession(row: any): RefreshTokenSession | null {
        if (!row) return null;

        const session = new RefreshTokenSession();
        session.userId = row.user_id;
        session.tokenId = row.token_id;
        session.deviceId = row.device_id;
        session.isRevoked = row.is_revoked;
        session.expiresAt = row.expires_at;

        return session;
    }

    async createSession(dto: CreateRefreshTokenSessionDto, refreshTime: number): Promise<void> {
        const expiresAt = add(new Date(), { seconds: refreshTime });

        await this.databaseService.sql`
            INSERT INTO refresh_token_sessions (
                user_id,
                token_id,
                device_id,
                is_revoked,
                expires_at
            ) VALUES (
                ${dto.userId},
                ${dto.tokenId},
                ${dto.deviceId},
                ${false},
                ${expiresAt}
            )
        `;
    }

    async findSessionByTokenId(tokenId: string): Promise<RefreshTokenSession | null> {
        const result = await this.databaseService.sql`
            SELECT * FROM refresh_token_sessions
            WHERE token_id = ${tokenId}
            LIMIT 1
        `;
        return this.mapToSession(result[0]);
    }

    async invalidateSession(tokenId: string): Promise<boolean> {
        const result = await this.databaseService.sql`
            UPDATE refresh_token_sessions
            SET is_revoked = ${true}
            WHERE token_id = ${tokenId}
            RETURNING id
        `;
        return result.length > 0;
    }

    async deleteExpiredSessions(): Promise<void> {
        await this.databaseService.sql`
            DELETE FROM refresh_token_sessions
            WHERE expires_at < ${new Date()}
        `;
    }

    // Add these new methods for device-related operations
    async deleteByDeviceId(deviceId: string): Promise<boolean> {
        const result = await this.databaseService.sql`
            DELETE FROM refresh_token_sessions
            WHERE device_id = ${deviceId}
            RETURNING id
        `;
        return result.length > 0;
    }

    async deleteAllUserSessionsExceptOne(userId: string, deviceIdToKeep: string): Promise<boolean> {
        const result = await this.databaseService.sql`
            DELETE FROM refresh_token_sessions
            WHERE user_id = ${userId}
            AND device_id != ${deviceIdToKeep}
            RETURNING id
        `;
        return result.length > 0;
    }

    async findSessionsByUserId(userId: string): Promise<RefreshTokenSession[]> {
        const results = await this.databaseService.sql`
            SELECT * FROM refresh_token_sessions
            WHERE user_id = ${userId}
            ORDER BY expires_at DESC
        `;

        const sessions: RefreshTokenSession[] = [];
        for (const row of results) {
            const session = this.mapToSession(row);
            if (session) {
                sessions.push(session);
            }
        }

        return sessions;
    }
};
import { Injectable } from '@nestjs/common';
import { SecurityDevice, SecurityDeviceDocument } from '../domain/security-devices.entity';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class SecurityDevicesRepository {

    constructor(
        private databaseService: DatabaseService,
    ){}

    // Helper to convert database rows to SecurityDevice entities
    private mapToDevice(row: any): SecurityDevice | null {
        if (!row) return null;

        const device = new SecurityDevice();
        device.userId = row.user_id;
        device.deviceId = row.device_id;
        device.ip = row.ip;
        device.title = row.title;
        device.lastActiveDate = row.last_active_date;
        device.expiresAt = row.expires_at;
        device.deletedAt = row.deleted_at;

        return device;
    }


    async create(newDevice: SecurityDevice): Promise<void> {
        await this.databaseService.sql`
            INSERT INTO security_devices (
                user_id,
                device_id,
                ip,
                title,
                last_active_date,
                expires_at,
                deleted_at
            ) VALUES (
                ${newDevice.userId},
                ${newDevice.deviceId},
                ${newDevice.ip},
                ${newDevice.title},
                ${newDevice.lastActiveDate},
                ${newDevice.expiresAt},
                ${newDevice.deletedAt}
            )
        `;
    }

    async findByDeviceId(deviceId: string): Promise<SecurityDevice | null> {
        try {
            const result = await this.databaseService.sql`
                SELECT * FROM security_devices
                WHERE device_id = ${deviceId}
                AND deleted_at IS NULL
                LIMIT 1
            `;
            return this.mapToDevice(result[0]);
        } catch (error) {
            console.error('Error finding device by deviceId:', error);
            return null;
        }
    }
    async findDevicesByUserId(userId: string): Promise<SecurityDevice[]> {
        const results = await this.databaseService.sql`
            SELECT * FROM security_devices
            WHERE user_id = ${userId}
            AND deleted_at IS NULL
            ORDER BY last_active_date DESC
        `;

        const devices: SecurityDevice[] = [];
        for (const row of results) {
            const device = this.mapToDevice(row);
            if (device) {
                devices.push(device);
            }
        }

        return devices;
    }

    async updateLastActiveDate(deviceId: string, lastActiveDate: Date): Promise<boolean> {
        const result = await this.databaseService.sql`
            UPDATE security_devices
            SET last_active_date = ${lastActiveDate}
            WHERE device_id = ${deviceId}
            AND deleted_at IS NULL
            RETURNING id
        `;
        return result.length > 0;
    }

    async deleteByDeviceId(deviceId: string): Promise<boolean> {
        const result = await this.databaseService.sql`
            UPDATE security_devices
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE device_id = ${deviceId}
            AND deleted_at IS NULL
            RETURNING id
        `;
        console.log(result)
        return result.length > 0;
    }

    async deleteAllExceptOne(userId: string, deviceIdToKeep: string): Promise<boolean> {
        const result = await this.databaseService.sql`
            UPDATE security_devices
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE user_id = ${userId}
            AND device_id != ${deviceIdToKeep}
            AND deleted_at IS NULL
            RETURNING id
        `;
        return result.length > 0;
    }

    async deleteAllByUserId(userId: string): Promise<boolean> {
        const result = await this.databaseService.sql`
            UPDATE security_devices
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE user_id = ${userId}
            AND deleted_at IS NULL
            RETURNING id
        `;
        return result.length > 0;
    }
};
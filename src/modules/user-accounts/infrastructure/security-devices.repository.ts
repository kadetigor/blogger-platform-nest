import { Injectable, NotFoundException } from '@nestjs/common';
import { SecurityDevice } from '../domain/security-devices.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateSecuretyDeviceDto } from '../domain/dto/create-security-device.dto';

@Injectable()
export class SecurityDevicesRepository {

    constructor(@InjectRepository(SecurityDevice) private repository: Repository<SecurityDevice>){}

    async createDevice(dto: CreateSecuretyDeviceDto, refreshTime: number): Promise<SecurityDevice> {
        const device = await this.repository.create({
            user_id: dto.userId,
            device_id: dto.deviceId,
            ip: dto.ip,
            title: dto.title,
            expires_at: new Date(Date.now() + refreshTime)
        })

        return this.repository.save(device)
    }

    async findByDeviceId(deviceId: string): Promise<SecurityDevice | null> {
        try {
            const result = await this.repository.findOneBy({
                id: deviceId,
            });
            
            return result;
        } catch (error) {
            console.error('Error finding device by deviceId:', error);
            return null;
        }
    }
    
    async findDevicesByUserId(userId: string): Promise<SecurityDevice[]> {
        const result = await this.repository.find({
            order:
                {
                last_active_date: "DESC",
                },
        })

        return result;
    }

    async updateLastActiveDate(id: string, lastActiveDate: Date): Promise<boolean> {
        try {
            const result = await this.repository.update(
                {id},
                {
                    last_active_date: lastActiveDate
                }
            )

            return result.affected !== undefined && result.affected > 0;
        } catch (error) {
            return false
        }
    }

    async deleteByDeviceId(id: string): Promise<void> {
        try {
            await this.repository.softDelete({id})
        } catch (error) {
            throw new NotFoundException
        }
    }

    async deleteAllExceptOne(userId: string, deviceIdToKeep: string): Promise<boolean> {
        try {
            const result = await this.repository.softDelete(
                {
                    user_id: userId,
                    id: Not(deviceIdToKeep)
                },
            )

            return result.affected !== undefined && result.affected > 0;
        } catch (error) {
            return false
        }
    }

    async deleteAllByUserId(userId: string): Promise<boolean> {
        try {
            const result = await this.repository.softDelete(
                {
                    user_id: userId,
                },
            )

            return result.affected !== undefined && result.affected > 0;
        } catch (error) {
            return false
        }
    }
};
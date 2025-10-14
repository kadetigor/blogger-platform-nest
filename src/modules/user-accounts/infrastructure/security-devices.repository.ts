import { Injectable, NotFoundException } from '@nestjs/common';
import { SecurityDevice } from '../domain/security-devices.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { CreateSecuretyDeviceDto } from '../domain/dto/create-security-device.dto';

@Injectable()
export class SecurityDevicesRepository {

    constructor(@InjectRepository(SecurityDevice) private repository: Repository<SecurityDevice>){}

    async createDevice(dto: CreateSecuretyDeviceDto, refreshTime: number): Promise<SecurityDevice> {
        const device = this.repository.create({
            userId: dto.userId,
            deviceId: dto.deviceId,
            ip: dto.ip,
            title: dto.title,
            expiresAt: new Date(Date.now() + refreshTime * 1000)
        })

        return this.repository.save(device)
    }

    async findByDeviceId(deviceId: string): Promise<SecurityDevice | null> {
        try {
            const result = await this.repository.findOneBy({
                deviceId: deviceId,
                deletedAt: IsNull()
            });
            
            return result;
        } catch (error) {
            console.error('Error finding device by deviceId:', error);
            return null;
        }
    }
    
    async findDevicesByUserId(userId: string): Promise<SecurityDevice[]> {
        const result = await this.repository.find({
            where: {
                userId: userId,
                deletedAt: IsNull()
            },
            order:{
                lastActiveDate: "DESC",
            },
        })

        return result;
    }

    async updateLastActiveDate(deviceId: string, lastActiveDate: Date): Promise<boolean> {
        try {
            const result = await this.repository.update(
                {deviceId},
                {
                    lastActiveDate: lastActiveDate
                }
            )

            return result.affected !== undefined && result.affected > 0;
        } catch (error) {
            return false
        }
    }

    async deleteByDeviceId(deviceId: string): Promise<void> {
        try {
            await this.repository.softDelete({deviceId})
        } catch (error) {
            throw new NotFoundException
        }
    }

    async deleteAllExceptOne(userId: string, deviceIdToKeep: string): Promise<boolean> {
        try {
            const result = await this.repository.softDelete(
                {
                    userId: userId,
                    deviceId: Not(deviceIdToKeep)
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
                    userId: userId,
                },
            )

            return result.affected !== undefined && result.affected > 0;
        } catch (error) {
            return false
        }
    }
};
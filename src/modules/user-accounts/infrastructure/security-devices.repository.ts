import { Injectable } from '@nestjs/common';
import { SecurityDevice, SecurityDeviceDocument, SecurityDeviceModelType } from '../domain/security-devices.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class SecurityDevicesRepository {

    constructor(
        @InjectModel(SecurityDevice.name) private SecurityDeviceModel: Model<SecurityDeviceDocument>,
    ){}


    async create(newDevice: SecurityDevice): Promise<void> {
        const device = new this.SecurityDeviceModel(newDevice);
        await device.save();
    }

    async findByDeviceId(deviceId: string): Promise<SecurityDevice | null> {
        try {
            return await this.SecurityDeviceModel.findOne({ "deviceId" : deviceId });
        } catch (error) {
            console.error('Error finding device by deviceId:', error);
            return null;
        }
    }
    async findDevicesByUserId(userId: string): Promise<SecurityDeviceDocument[]> {
        return await this.SecurityDeviceModel.find({ "userId" : userId }).lean();
    }

    async updateLastActiveDate(deviceId: string, lastActiveDate: Date): Promise<boolean> {
        const result = await this.SecurityDeviceModel.updateOne(
            { deviceId },
            { $set: { lastActiveDate: lastActiveDate } }
        );
        return result.modifiedCount > 0;
    }

    async deleteByDeviceId(deviceId: string): Promise<boolean> {
        const result = await this.SecurityDeviceModel.deleteOne({ "deviceId": deviceId });
        console.log(result)
        return result.deletedCount > 0;
    }

    async deleteAllExceptOne(userId: string, deviceIdToKeep: string): Promise<boolean> {
        const result = await this.SecurityDeviceModel.deleteMany({
            userId,
            deviceId: { $ne: deviceIdToKeep }
        });
        return result.deletedCount > 0;
    }

    async deleteAllByUserId(userId: string): Promise<boolean> {
        const result = await this.SecurityDeviceModel.deleteMany({ "userId": userId });
        return result.deletedCount > 0;
    }
};
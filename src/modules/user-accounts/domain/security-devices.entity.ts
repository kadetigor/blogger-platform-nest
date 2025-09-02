import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { add } from "date-fns";
import { HydratedDocument, Model } from "mongoose";
import { CreateSecuretyDeviceDto } from "./dto/create-security-device.dto";



@Schema({
    timestamps: true,
    collection: 'security-devices'
})
export class SecurityDevice {
    @Prop({ type: String, required: true })
    userId: string;

    @Prop({ type: String, required: true })
    deviceId: string;

    @Prop({ type: String, required: true })
    ip: string;
    
    @Prop({ type: String, required: true })
    title: string;

    @Prop({ type: Date, default: Date.now })
    lastActiveDate: Date;

    @Prop({ type: Date, required: true })
    expiresAt: Date;

    @Prop({ type: Date, nullable: true })
    deletedAt: Date | null;

    static createInstance(dto: CreateSecuretyDeviceDto, refreshTime: number): SecurityDeviceDocument {
        const device = new this();
        device.userId = dto.userId;
        device.deviceId = dto.deviceId;
        device.ip = dto.ip;
        device.title = dto.title;
        device.lastActiveDate = new Date()
        device.expiresAt = add(new Date(), { seconds: refreshTime })
        device.deletedAt = null
    
        return device as SecurityDeviceDocument;
    }
}

export const SecurityDeviceSchema = SchemaFactory.createForClass(SecurityDevice);

// Add indexes for common queries
SecurityDeviceSchema.index({ userId: 1, deletedAt: 1 });
SecurityDeviceSchema.index({ deviceId: 1, deletedAt: 1 });

SecurityDeviceSchema.loadClass(SecurityDevice);

export type SecurityDeviceDocument = HydratedDocument<SecurityDevice>;

export type SecurityDeviceModelType = Model<SecurityDeviceDocument> & typeof SecurityDevice;
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Model } from "mongoose";
import { CreateRefreshTokenSessionDto } from "./dto/create-refresh-token-session.dto";
import { add } from 'date-fns'


@Schema({ timestamps: true }) 
export class RefreshTokenSession {
    @Prop({ type: String, required: true })
    userId: string;

    @Prop({ type: String, required: true })
    tokenId: string;

    @Prop({ type: String, required: true })
    deviceId: string;

    @Prop({ type: Boolean, required: true })
    isRevoked: boolean;

    @Prop({ type: Date, required: true })
    expiresAt: Date;

    static createInstance(dto: CreateRefreshTokenSessionDto, refreshTime: number): RefreshTokenSessionDocument {
      const session = new this();
      session.userId = dto.userId;
      session.tokenId = dto.tokenId;
      session.deviceId = dto.deviceId;
      session.isRevoked = false;
      session.expiresAt = add(new Date(), { seconds: refreshTime })
  
      return session as RefreshTokenSessionDocument;
    }
}

export const RefreshTokenSessionSchema = SchemaFactory.createForClass(RefreshTokenSession);

// Add indexes for common queries
RefreshTokenSessionSchema.index({ userId: 1, deletedAt: 1 });
RefreshTokenSessionSchema.index({ deviceId: 1, deletedAt: 1 });

RefreshTokenSessionSchema.loadClass(RefreshTokenSession);

export type RefreshTokenSessionDocument = HydratedDocument<RefreshTokenSession>;

export type RefreshTokenSessionModelType = Model<RefreshTokenSession> & typeof RefreshTokenSession;

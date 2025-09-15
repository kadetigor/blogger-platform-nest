import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateUserDomainDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/create-user.dto';
import { Name, NameSchema } from './name.schema';

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true })
  login: string;

  @Prop({ type: String, required: true })
  passwordHash: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: Boolean, required: true, default: false })
  isEmailConfirmed: boolean;

  @Prop({ type: String, nullable: true })
  confirmationCode: string | null;

  @Prop({ type: Date, nullable: true })
  confirmationCodeExpiry: Date | null;

  @Prop({ type: NameSchema })
  name: Name;
  
  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: Date, nullable: true })
  deletedAt: Date | null;

  static createInstance(dto: CreateUserDomainDto): UserDocument {
    const user = new this();
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.login = dto.login;
    user.isEmailConfirmed = false;
    user.confirmationCode = null;
    user.confirmationCodeExpiry = null;

    user.name = {
      firstName: 'firstName xxx',
      lastName: 'lastName yyy',
    };

    user.deletedAt = null;

    return user as UserDocument;
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deletedAt = new Date();
  }

  setConfirmationCode(code: string) {
    this.confirmationCode = code;
    this.confirmationCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }

  confirmEmail(code: string): boolean {
    if (!this.confirmationCode || this.confirmationCode !== code) {
      return false;
    }

    if (this.confirmationCodeExpiry && this.confirmationCodeExpiry < new Date()) {
      return false;
    }

    this.isEmailConfirmed = true;
    this.confirmationCode = null;
    this.confirmationCodeExpiry = null;
    return true;
  }

  update(dto: UpdateUserDto) {
    if (dto.email !== this.email) {
      this.isEmailConfirmed = false;
    }
    this.email = dto.email;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.loadClass(User);

export type UserDocument = HydratedDocument<User>;

export type UserModelType = Model<UserDocument> & typeof User;
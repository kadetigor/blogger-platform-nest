// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { User, UserDocument, UserModelType } from '../domain/user.entity';
// import { Types } from 'mongoose';
// import { CreateUserDomainDto } from '../dto/create-user.dto';

// @Injectable()
// export class UsersRepository {
//   constructor(
//     @InjectModel(User.name)
//     private UserModel: UserModelType,
//   ) {}

//   async save(user: UserDocument): Promise<UserDocument> {
//     return await user.save();
//   }

//   async findById(id: string): Promise<UserDocument | null> {
//     if (!Types.ObjectId.isValid(id)) {
//       return null;
//     }
//     return await this.UserModel.findOne({ _id: id, deletedAt: null }).exec();
//   }

//   async findOrNotFoundFail(id: string): Promise<UserDocument> {
//     const user = await this.findById(id);
//     if (!user) {
//       throw new Error('User not found');
//     }
//     return user;
//   }

//   async findByLogin(login: string): Promise<UserDocument | null> {
//     return await this.UserModel.findOne({ login, deletedAt: null }).exec();
//   }

//   async findByEmail(email: string): Promise<UserDocument | null> {
//     return await this.UserModel.findOne({ email, deletedAt: null }).exec();
//   }

//   async findByLoginOrEmail(loginOrEmail: string): Promise<UserDocument | null> {
//     return await this.UserModel.findOne({
//       $or: [
//         { login: loginOrEmail },
//         { email: loginOrEmail }
//       ],
//       deletedAt: null
//     }).exec();
//   }

//   async findByConfirmationCode(code: string): Promise<UserDocument | null> {
//     return await this.UserModel.findOne({ 
//       confirmationCode: code,
//       deletedAt: null 
//     }).exec();
//   }

//   async createUser(dto: CreateUserDomainDto): Promise<UserDocument> {
//     const user = this.UserModel.createInstance(dto);
//     return await this.save(user);
//   }

//   async findAll(skip: number = 0, limit: number = 10): Promise<UserDocument[]> {
//     return await this.UserModel
//       .find({ deletedAt: null })
//       .skip(skip)
//       .limit(limit)
//       .exec();
//   }

//   async count(): Promise<number> {
//     return await this.UserModel.countDocuments({ deletedAt: null }).exec();
//   }

//   async updateConfirmationCode(id: string, newConfirmationCode: string): Promise<boolean> {
//         const result = await this.UserModel.findByIdAndUpdate(
//             id,
//             { $set: { 'emailConfirmation.confirmationCode': newConfirmationCode } }
//         );
//         return !!result;
//     }
  
//   async updatePassword(id: string, passwordHash: string): Promise<boolean> {
//         const result = await this.UserModel.findByIdAndUpdate(
//             id,
//             { $set: { passwordHash } }
//         );
//         return !!result;
//     }

//   async clearRecoveryCode(id: string): Promise<boolean> {
//       const result = await this.UserModel.findByIdAndUpdate(
//           id,
//           { $set: { 'emailConfirmation.confirmationCode': '' } }
//       );
//       return !!result;
//   }
// }
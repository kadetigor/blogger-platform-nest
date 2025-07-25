import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../domain/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import bcrypt from 'bcrypt';
import { UsersRepository } from '../infrastructure/users.repository';
import { UpdateUserDto } from '../dto/create-user.dto';
import { isValidObjectId } from 'mongoose';
 
@Injectable()
export class UsersService {
  constructor(
    //инжектирование модели в сервис через DI
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private usersRepository: UsersRepository,
  ) {}
 
  async createUser(dto: CreateUserDto): Promise<string> {
    //TODO: move to brypt service
    const passwordHash = await bcrypt.hash(dto.password, 10);
 
    const user = this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      password: passwordHash,
    });
 
    await this.usersRepository.save(user);
 
    return user._id.toString();
  }
 
    async updateUser(id: string, dto: UpdateUserDto): Promise<string> {
    const user = await this.usersRepository.findOrNotFoundFail(id);
 
    user.update(dto);
 
    await this.usersRepository.save(user);
 
    return user._id.toString();
  }
 
  async deleteUser(id: string): Promise<void> {
    // First validate the ObjectId format
    if (!isValidObjectId(id)) {
      throw new NotFoundException('user not found');
    }
    
    // Use findById instead of findOrNotFoundFail to handle both cases
    const user = await this.usersRepository.findById(id);
    
    if (!user) {
      throw new NotFoundException('user not found');
    }
    
    // If already deleted, just return successfully (idempotent operation)
    if (user.deletedAt !== null) {
      throw new NotFoundException('user not found');
    }
    
    user.makeDeleted();
    await this.usersRepository.save(user);
  }
}
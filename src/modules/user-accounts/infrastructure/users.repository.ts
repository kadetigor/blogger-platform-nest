import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { CreateUserDomainDto, UpdateUserDto } from '../dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

@Injectable()
export class UsersRepository {
  constructor(@InjectRepository(User) private repository: Repository<User>) {}

  async save(user: User): Promise<User> {
    return this.repository.save(user);
}
  
  async createUser(dto: CreateUserDomainDto): Promise<User> {
    const user = this.repository.create({
      email: dto.email,
      login: dto.login,
      passwordHash: dto.passwordHash,
    });
    
    return this.repository.save(user);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    await this.repository.update({id}, dto)

    const updatedUser = await this.findById(id);
    
    if (!updatedUser) {
      throw new NotFoundException
    } else {
      return updatedUser
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.repository.softDelete({id})
    } catch (error) {
      throw new NotFoundException
    }
  }

  async updateConfirmationCode(id: string, newConfirmationCode: string): Promise<boolean> {
    try {
      const result = await this.repository.update(
        {id},
        {
          confirmationCode: newConfirmationCode,
          confirmationCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        
      )
      
      return result.affected !== undefined && result.affected > 0;
    } catch (error) {
      return false;
    }
  }
  
  async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    try {
      const result = await this.repository.update(
        {id},
        {
          passwordHash: passwordHash,
        },
        
      )
      
      return result.affected !== undefined && result.affected > 0;
    } catch (error) {
      return false;
    }
  }

  async clearRecoveryCode(id: string): Promise<boolean> {
    try {
      const result = await this.repository.update(
        {id},
        {
          confirmationCode: null,
          confirmationCodeExpiry: null
        },
        
      )
      
      return result.affected !== undefined && result.affected > 0;
    } catch (error) {
      return false;
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const result = await this.repository.findOneBy({
        id: id,
        deletedAt: IsNull()
      });
      
      return result;
    } catch (error) {
      // Invalid UUID format
      return null;
    }
  }

  async getByIdOrNotFoundFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByLogin(login: string): Promise<User | null> {
    const result = await this.repository.findOneBy({
      login: login,
      deletedAt: IsNull(),
    })
    
    return result;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.repository.findOneBy({
      email: email,
      deletedAt: IsNull()
    })
    
    return result;
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<User | null> {
    const result = await this.repository.findOne({
      where: [
        { login: loginOrEmail },// this means OR is used
        { email: loginOrEmail }
      ]
    })
    
    return result;
  }

  async findByConfirmationCode(code: string): Promise<User | null> {
    const result = await this.repository.findOneBy({
      confirmationCode: code,
      deletedAt: IsNull()
    })
    
    return result;
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<User[]> {

    const result = await this.repository.find({
      order:
        {
          createdAt: "DESC",
        },
      take: limit,
      skip: skip,
    })
    
    return result;
  }
}
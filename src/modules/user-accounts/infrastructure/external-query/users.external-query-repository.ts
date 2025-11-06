import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../domain/user.entity';
import { IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersExternalQueryRepository {
  constructor(@InjectRepository(User) private repository: Repository<User>) {}
  
  // Helper to convert database rows to User entities
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
      deletedAt: IsNull()
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

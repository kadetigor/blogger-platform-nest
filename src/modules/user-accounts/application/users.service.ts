// users.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../infrastructure/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
  ) {}

  async createUser(dto: CreateUserDto): Promise<string> {
    // Check if user with same login exists
    const existingUserByLogin = await this.usersRepository.findByLogin(dto.login);
    if (existingUserByLogin) {
      throw new BadRequestException({
        errorsMessages: [{ field: 'login', message: 'Login already exists' }],
      });
    }

    // Check if user with same email exists
    const existingUserByEmail = await this.usersRepository.findByEmail(dto.email);
    if (existingUserByEmail) {
      throw new BadRequestException({
        errorsMessages: [{ field: 'email', message: 'Email already exists' }],
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create the user directly in the repository
    // This ensures the user has an ID after creation
    const savedUser = await this.usersRepository.createUser({
      email: dto.email,
      login: dto.login,
      passwordHash: passwordHash,
    });

    // Now savedUser.id is guaranteed to be non-null
    if (!savedUser.id) {
      throw new Error('Failed to create user - no ID returned');
    }

    return savedUser.id;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<string> {
    const user = await this.usersRepository.findOrNotFoundFail(id);

    // Check if new email is taken (if email is being changed)
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.usersRepository.findByEmail(dto.email);
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException({
          errorsMessages: [{ field: 'email', message: 'Email already exists' }],
        });
      }
    }

    user.update(dto);
    const updatedUser = await this.usersRepository.save(user);

    if (!updatedUser.id) {
      throw new Error('Failed to update user - no ID returned');
    }

    return updatedUser.id;
  }

  async deleteUser(id: string): Promise<void> {
    // Try to find the user
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If already deleted, just return successfully (idempotent operation)
    if (user.deletedAt !== null) {
      return;
    }

    user.makeDeleted();
    await this.usersRepository.save(user);
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findOrNotFoundFail(id);
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    const updated = await this.usersRepository.updatePassword(id, passwordHash);
    if (!updated) {
      throw new Error('Failed to update password');
    }
  }

  async getUserById(id: string): Promise<User> {
    return this.usersRepository.findOrNotFoundFail(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async getUserByLogin(login: string): Promise<User | null> {
    return this.usersRepository.findByLogin(login);
  }

  async getAllUsers(skip: number = 0, limit: number = 10): Promise<User[]> {
    return this.usersRepository.findAll(skip, limit);
  }

  async getUsersCount(): Promise<number> {
    return this.usersRepository.count();
  }
}
// users.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'path-to-your/database.service';
import { User, UserDocument } from '../domain/user.entity';
import { CreateUserDomainDto } from '../dto/create-user.dto';

@Injectable()
export class UsersRepository {
  constructor(private databaseService: DatabaseService) {}
  
  // Helper to convert database rows to User entities
  private mapToUser(row: any): User | null {
    if (!row) return null;
    
    return new User(
      row.id,
      row.email,
      row.login,
      row.password_hash,
      row.is_email_confirmed || false,
      row.confirmation_code,
      row.confirmation_code_expiry,
      row.created_at,
      row.updated_at,
      row.deleted_at
    );
  }
  
  async save(user: UserDocument): Promise<UserDocument> {
    const id = user.id || user._id?.toString();
    
    if (id) {
      // Update existing user
      const result = await this.databaseService.sql`
        UPDATE users 
        SET 
          email = ${user.email},
          login = ${user.login},
          password_hash = ${user.passwordHash},
          is_email_confirmed = ${user.isEmailConfirmed},
          confirmation_code = ${user.confirmationCode},
          confirmation_code_expiry = ${user.confirmationCodeExpiry},
          deleted_at = ${user.deletedAt},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}::uuid
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new NotFoundException('User not found');
      }
      
      const updatedUser = this.mapToUser(result[0]);
      if (!updatedUser) {
        throw new Error('Failed to map user from database');
      }
      
      return updatedUser;
    } else {
      // Insert new user
      const result = await this.databaseService.sql`
        INSERT INTO users (
          email, 
          login, 
          password_hash,
          is_email_confirmed,
          confirmation_code,
          confirmation_code_expiry
        ) VALUES (
          ${user.email},
          ${user.login},
          ${user.passwordHash},
          ${user.isEmailConfirmed},
          ${user.confirmationCode},
          ${user.confirmationCodeExpiry}
        )
        RETURNING *
      `;
      
      const newUser = this.mapToUser(result[0]);
      if (!newUser) {
        throw new Error('Failed to create user');
      }
      
      return newUser;
    }
  }

  async findById(id: string): Promise<UserDocument | null> {
    try {
      const result = await this.databaseService.sql`
        SELECT * FROM users 
        WHERE id = ${id}::uuid 
        AND deleted_at IS NULL
        LIMIT 1
      `;
      
      return this.mapToUser(result[0]);
    } catch (error) {
      // Invalid UUID format
      return null;
    }
  }

  async findOrNotFoundFail(id: string): Promise<UserDocument> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByLogin(login: string): Promise<UserDocument | null> {
    const result = await this.databaseService.sql`
      SELECT * FROM users 
      WHERE login = ${login}
      AND deleted_at IS NULL
      LIMIT 1
    `;
    
    return this.mapToUser(result[0]);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const result = await this.databaseService.sql`
      SELECT * FROM users 
      WHERE email = ${email}
      AND deleted_at IS NULL
      LIMIT 1
    `;
    
    return this.mapToUser(result[0]);
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<UserDocument | null> {
    const result = await this.databaseService.sql`
      SELECT * FROM users 
      WHERE (login = ${loginOrEmail} OR email = ${loginOrEmail})
      AND deleted_at IS NULL
      LIMIT 1
    `;
    
    return this.mapToUser(result[0]);
  }

  async findByConfirmationCode(code: string): Promise<UserDocument | null> {
    const result = await this.databaseService.sql`
      SELECT * FROM users 
      WHERE confirmation_code = ${code}
      AND deleted_at IS NULL
      LIMIT 1
    `;
    
    return this.mapToUser(result[0]);
  }

  async createUser(dto: CreateUserDomainDto): Promise<UserDocument> {
    const user = User.createInstance({
      email: dto.email,
      login: dto.login,
      passwordHash: dto.passwordHash,
    });
    
    // Set confirmation code if provided
    if (dto.confirmationCode) {
      user.setConfirmationCode(dto.confirmationCode);
    }
    
    return this.save(user);
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<UserDocument[]> {
    const results = await this.databaseService.sql`
      SELECT * FROM users 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `;
    
    const users: User[] = [];
    for (const row of results) {
      const user = this.mapToUser(row);
      if (user) {
        users.push(user);
      }
    }
    
    return users;
  }

  async count(): Promise<number> {
    const result = await this.databaseService.sql`
      SELECT COUNT(*) as count FROM users 
      WHERE deleted_at IS NULL
    `;
    
    return parseInt(result[0].count, 10);
  }

  async updateConfirmationCode(id: string, newConfirmationCode: string): Promise<boolean> {
    try {
      const result = await this.databaseService.sql`
        UPDATE users 
        SET 
          confirmation_code = ${newConfirmationCode},
          confirmation_code_expiry = ${new Date(Date.now() + 24 * 60 * 60 * 1000)},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}::uuid
        AND deleted_at IS NULL
        RETURNING id
      `;
      
      return result.length > 0;
    } catch (error) {
      return false;
    }
  }
  
  async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    try {
      const result = await this.databaseService.sql`
        UPDATE users 
        SET 
          password_hash = ${passwordHash},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}::uuid
        AND deleted_at IS NULL
        RETURNING id
      `;
      
      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  async clearRecoveryCode(id: string): Promise<boolean> {
    try {
      const result = await this.databaseService.sql`
        UPDATE users 
        SET 
          confirmation_code = NULL,
          confirmation_code_expiry = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}::uuid
        AND deleted_at IS NULL
        RETURNING id
      `;
      
      return result.length > 0;
    } catch (error) {
      return false;
    }
  }
}
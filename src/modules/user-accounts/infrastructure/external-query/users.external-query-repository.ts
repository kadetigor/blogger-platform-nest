import { Injectable, NotFoundException } from '@nestjs/common';
import { UserExternalDto } from './external-dto/users.external-dto';
import { DatabaseService } from 'src/modules/database/database.service';
import { User, UserDocument } from '../../domain/user.entity';

@Injectable()
export class UsersExternalQueryRepository {
  constructor(private databaseService: DatabaseService) {}
  
  // Helper to convert database rows to User entities
  private mapToUser(row: any): User | null {
    if (!row) return null;

    return new User(
      row.id, // Always non-null from database due to NOT NULL constraint
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

  async getByIdOrNotFoundFail(id: string): Promise<UserDocument> {
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
}

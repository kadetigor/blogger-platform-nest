import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "src/modules/database/database.service";
import { User, UserDocument } from "../../domain/user.entity";
import { GetUsersQueryParams } from "../../api/input-dto/get-users-query-params.input-dto";
import { UsersSortBy } from "../../api/input-dto/users-sort-by";
import { SortDirection } from "src/core/dto/base.query-params.input-dto";

@Injectable()
export class UsersQueryRepository {
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

  async getAll(query: GetUsersQueryParams) {
    const skip = query.calculateSkip();
    const limit = query.pageSize;

    // Build the WHERE conditions dynamically
    let whereClause = "deleted_at IS NULL";

    // Build search conditions - should be OR, not AND
    let searchConditions: string[] = [];

    if (query.searchLoginTerm) {
      searchConditions.push(`login ILIKE '%${query.searchLoginTerm}%'`);
    }

    if (query.searchEmailTerm) {
      searchConditions.push(`email ILIKE '%${query.searchEmailTerm}%'`);
    }

    if (searchConditions.length > 0) {
      whereClause += ` AND (${searchConditions.join(" OR ")})`;
    }

    // Build ORDER BY clause
    let orderByColumn = "created_at";
    switch (query.sortBy) {
      case UsersSortBy.Login:
        orderByColumn = "login";
        break;
      case UsersSortBy.Email:
        orderByColumn = "email";
        break;
      case UsersSortBy.CreatedAt:
      default:
        orderByColumn = "created_at";
        break;
    }
    const orderDirection = query.sortDirection === SortDirection.Asc ? "ASC" : "DESC";

    // Get total count
    const countResult = await this.databaseService.sql`
      SELECT COUNT(*) as count FROM users
      WHERE ${this.databaseService.sql.unsafe(whereClause)}
    `;
    const totalCount = parseInt(countResult[0].count, 10);

    // Get paginated results
    const results = await this.databaseService.sql`
      SELECT * FROM users
      WHERE ${this.databaseService.sql.unsafe(whereClause)}
      ORDER BY ${this.databaseService.sql.unsafe(orderByColumn)} ${this.databaseService.sql.unsafe(orderDirection)}
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

    return {
      items: users,
      totalCount,
      page: query.pageNumber,
      pageSize: query.pageSize,
      pagesCount: Math.ceil(totalCount / query.pageSize)
    };
  }

  async count(): Promise<number> {
    const result = await this.databaseService.sql`
      SELECT COUNT(*) as count FROM users 
      WHERE deleted_at IS NULL
    `;
    
    return parseInt(result[0].count, 10);
  }
}
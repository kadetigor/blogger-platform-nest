import { Injectable, NotFoundException } from "@nestjs/common";
import { User } from "../../domain/user.entity";
import { GetUsersQueryParams } from "../../api/input-dto/get-users-query-params.input-dto";
import { UsersSortBy } from "../../api/input-dto/users-sort-by";
import { SortDirection } from "src/core/dto/base.query-params.input-dto";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, ILike, IsNull, Repository } from "typeorm";

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectRepository(User) private repository: Repository<User>) {}
  
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

  async getAll(query: GetUsersQueryParams) {
    const skip = query.calculateSkip();
    const limit = query.pageSize;

    // Build WHERE conditions with proper typing
    const whereConditions: FindOptionsWhere<User>[] = [];
    
    if (query.searchLoginTerm && query.searchEmailTerm) {
      whereConditions.push(
        { login: ILike(`%${query.searchLoginTerm}%`) },
        { email: ILike(`%${query.searchEmailTerm}%`) }
      );
    } else if (query.searchLoginTerm) {
      whereConditions.push({ login: ILike(`%${query.searchLoginTerm}%`) });
    } else if (query.searchEmailTerm) {
      whereConditions.push({ email: ILike(`%${query.searchEmailTerm}%`) });
    }

    // Build ORDER BY dynamically
    let orderByColumn: keyof User = 'createdAt';
    switch (query.sortBy) {
      case UsersSortBy.Login:
        orderByColumn = 'login';
        break;
      case UsersSortBy.Email:
        orderByColumn = 'email';
        break;
      case UsersSortBy.CreatedAt:
      default:
        orderByColumn = 'createdAt';
        break;
    }

    // Get both items and count
    const [users, totalCount] = await this.repository.findAndCount({
      where: whereConditions.length > 0 ? whereConditions : undefined,
      order: {
        [orderByColumn]: query.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC'
      },
      skip,
      take: limit
    });

    return {
      items: users,
      totalCount,
      page: query.pageNumber,
      pageSize: query.pageSize,
      pagesCount: Math.ceil(totalCount / query.pageSize)
    };
  }
}
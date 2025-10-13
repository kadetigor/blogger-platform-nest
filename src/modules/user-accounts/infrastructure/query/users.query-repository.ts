import { Injectable, NotFoundException } from "@nestjs/common";
import { User } from "../../domain/user.entity";
import { GetUsersQueryParams } from "../../api/input-dto/get-users-query-params.input-dto";
import { UsersSortBy } from "../../api/input-dto/users-sort-by";
import { SortDirection } from "src/core/dto/base.query-params.input-dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectRepository(User) private repository: Repository<User>) {}
  
  async findById(id: string): Promise<User | null> {
    try {
      const result = await this.repository.findOneBy({
        id: id,
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
    })
    
    return result;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.repository.findOneBy({
      email: email,
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
      confirmation_code: code,
    })
    
    return result;
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<User[]> {

    const result = await this.repository.find({
      order:
        {
          created_at: "DESC",
        },
      take: limit,
      skip: skip,
    })
    
    return result;
  }
}
// src/modules/user-accounts/api/sa-users.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../application/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { BasicAuthGuard } from '../guards/basic/basic.auth-guard';
import { GetUsersQueryParams } from './input-dto/get-users-query-params.input-dto';
import { UserViewDto } from './view-dto/users.view-dto';

@Controller('sa/users')
export class SaUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @Post()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const userId = await this.usersService.createUser(createUserDto);
    const user = await this.usersQueryRepository.getByIdOrNotFoundFail(userId);
    return UserViewDto.mapToView(user);
  }

  @Get()
  @UseGuards(BasicAuthGuard)
  async findAll(
    @Query() query: GetUsersQueryParams,
  ) {
    const result = await this.usersQueryRepository.getAll(query);

    return {
      ...result,
      items: result.items.map(user => UserViewDto.mapToView(user))
    };
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
  }
}
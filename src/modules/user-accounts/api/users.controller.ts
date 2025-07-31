// src/modules/user-accounts/api/users.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../application/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/create-user.dto';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { BasicAuthGuard } from '../guards/basic/basic.auth-guard';
import { GetUsersQueryParams } from './input-dto/get-users-query-params.input-dto';

@Controller('users')
export class UsersController {
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
    return user;
  }

  @Get()
  @UseGuards(BasicAuthGuard)
  async findAll(
    @Query() query: GetUsersQueryParams,
  ) {
    return await this.usersQueryRepository.getAll(query);
  }

  @Get(':id')
  @UseGuards(BasicAuthGuard)
  async findOne(@Param('id') id: string) {
    return await this.usersQueryRepository.getByIdOrNotFoundFail(id);
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    await this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
  }
}
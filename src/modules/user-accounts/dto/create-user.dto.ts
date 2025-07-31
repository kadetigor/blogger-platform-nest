// src/modules/user-accounts/dto/create-user.dto.ts
import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(3, 10)
  login: string;

  @IsString()
  @Length(6, 20)
  password: string;

  @IsEmail()
  email: string;
}

export class UpdateUserDto {
  @IsEmail()
  email: string;
}

export class CreateUserDomainDto {
  login: string;
  passwordHash: string;
  email: string;
}
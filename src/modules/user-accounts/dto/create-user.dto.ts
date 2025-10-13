// src/modules/user-accounts/dto/create-user.dto.ts
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(3, 10)
  @Matches(/^[a-zA-Z0-9_-]*$/, {
    message: 'Login can only contain letters, numbers, underscores, and hyphens'
  })
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
  password_hash: string;
  email: string;
}
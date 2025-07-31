import { IsEmail, IsString, Length, IsNotEmpty } from 'class-validator';

export class LoginInputDto {
  @IsString()
  @IsNotEmpty()
  loginOrEmail: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegistrationInputDto {
  @IsString()
  @Length(3, 10)
  login: string;

  @IsString()
  @Length(6, 20)
  password: string;

  @IsEmail()
  email: string;
}

export class RegistrationConfirmationInputDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class RegistrationEmailResendingInputDto {
  @IsEmail()
  email: string;
}

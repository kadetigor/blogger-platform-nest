import { IsString, Length } from "class-validator";

export class PasswordRecoveryDto {
    @IsString()
    @Length(6, 20, { message: 'Password must be between 6 and 20 characters' })
    newPassword: string;
    recoveryCode: string;
}
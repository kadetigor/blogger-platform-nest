import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../infrastructure/users.repository';
import { UsersService } from './users.service';
import { EmailService } from '../../notifications/email.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { CreateUserDto } from '../dto/create-user.dto';
import { v4 as uuid } from 'uuid';
import { PasswordRecoveryDto } from '../api/input-dto/password-recovery-dto';
import { ConfigService } from '@nestjs/config';

export interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface OperationResult {
  success: boolean;
  errors?: Array<{ field: string; message: string }>;
}

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async validateUser(loginOrEmail: string, password: string): Promise<any> {
    const user = await this.usersRepository.findByLoginOrEmail(loginOrEmail);
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return null;
    }

    return {
      userId: user._id.toString(),
      login: user.login,
      email: user.email,
    };
  }

  async login(loginOrEmail: string, password: string): Promise<AuthResult> {
    const user = await this.validateUser(loginOrEmail, password);
    
    if (!user) {
      throw new BadRequestException({ errorsMessages: [{ field: 'user', message: 'User was not found' }] });
    };

    const payload = { 
      id: user.userId, 
      login: user.login,
      email: user.email 
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: `${this.configService.get<string>('AC_TIME')}m` });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: `${this.configService.get<string>('REFRESH_TIME')}d` });
    
    return {
      success: true,
      accessToken: accessToken,
      refreshToken: refreshToken
    };
  }

  async registerUser(dto: CreateUserDto): Promise<OperationResult> {
    // Check if user with same login exists
    const existingUserByLogin = await this.usersRepository.findByLogin(dto.login);
    if (existingUserByLogin) {
      throw new BadRequestException({ errorsMessages: [{ field: 'user', message: 'User with same login exists' }] });
    }

    // Check if user with same email exists
    const existingUserByEmail = await this.usersRepository.findByEmail(dto.email);
    if (existingUserByEmail) {
      throw new BadRequestException({ errorsMessages: [{ field: 'email', message: 'Email already exists' }] });
    }

    try {
      // Create user
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const user = await this.usersRepository.createUser({
        email: dto.email,
        login: dto.login,
        passwordHash,
      });

      // Generate and save confirmation code
      const confirmationCode = randomUUID();
      user.setConfirmationCode(confirmationCode);
      await this.usersRepository.save(user);

      // Send confirmation email
      await this.emailService.sendConfirmationEmail(user.email, confirmationCode);

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        errors: [{ field: 'email', message: 'Registration failed' }],
      };
    }
  }

  async confirmRegistration(code: string): Promise<OperationResult> {
    const user = await this.usersRepository.findByConfirmationCode(code);
    
    if (!user) {
      throw new BadRequestException({ errorsMessages: [{ field: 'user', message: 'User was not found' }] });
    }

    if (user.isEmailConfirmed) {
      throw new BadRequestException({ errorsMessages: [{ field: 'email', message: 'Email already confirmed' }] });
    }

    const confirmed = user.confirmEmail(code);
    
    if (!confirmed) {
      throw new BadRequestException({ errorsMessages: [{ field: 'code', message: 'Code expired or invalid' }] });
    }

    await this.usersRepository.save(user);
    return { success: true };
  }

  async resendRegistrationEmail(email: string): Promise<OperationResult> {
    const user = await this.usersRepository.findByEmail(email);
    
    if (!user) {
      throw new BadRequestException({ errorsMessages: [{ field: 'user', message: 'User was not found' }] });
    }

    if (user.isEmailConfirmed) {
      throw new BadRequestException({ errorsMessages: [{ field: 'user', message: 'Email already confirmed' }] });
    }

    try {
      // Generate new confirmation code
      const confirmationCode = randomUUID();
      user.setConfirmationCode(confirmationCode);
      await this.usersRepository.save(user);

      // Send confirmation email
      await this.emailService.sendConfirmationEmail(email, confirmationCode);

      return { success: true };
    } catch (error) {
      console.error('Resend email error:', error);
      return {
        success: false,
        errors: [{ field: 'email', message: 'Failed to resend email' }],
      };
    }
  }

  async sendPasswordRecoveryEmail(email: string): Promise<void> {
    const user = await this.usersRepository.findByLoginOrEmail(email);
    
    if (!user) {
      return;
    }

    const newConfirmationCode = uuid();

    await this.usersRepository.updateConfirmationCode(user?.id, newConfirmationCode);

    try {
      const updatedUser = { ...user, confirmationCode: newConfirmationCode }
      await this.emailService.sendPasswordRecoveryEmail(updatedUser.email, updatedUser.confirmationCode);
    } catch (error) {
      console.log('Email sending failed, but code update continues:', error);
    }
  }

  async confirmPasswordRecovery(passwordRecoveryDto: PasswordRecoveryDto): Promise<void> {
    const code = passwordRecoveryDto.recoveryCode
    const newPassword = passwordRecoveryDto.newPassword

    const user = await this.usersRepository.findByConfirmationCode(code)

    if(!user) {
      throw new BadRequestException('User with this code was not found');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    await this.usersRepository.updatePassword(user.id, newPasswordHash)

    await this.usersRepository.clearRecoveryCode(user.id);
  }
}
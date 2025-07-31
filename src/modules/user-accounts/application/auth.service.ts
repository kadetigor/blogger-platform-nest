// src/modules/user-accounts/application/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../infrastructure/users.repository';
import { UsersService } from './users.service';
import { EmailService } from '../../notifications/email.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { CreateUserDto } from '../dto/create-user.dto';

export interface AuthResult {
  success: boolean;
  accessToken?: string;
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
      return { success: false };
    }

    const payload = { 
      userId: user.userId, 
      login: user.login,
      email: user.email 
    };
    
    return {
      success: true,
      accessToken: this.jwtService.sign(payload),
    };
  }

  async registerUser(dto: CreateUserDto): Promise<OperationResult> {
    // Check if user with same login exists
    const existingUserByLogin = await this.usersRepository.findByLogin(dto.login);
    if (existingUserByLogin) {
      return {
        success: false,
        errors: [{ field: 'login', message: 'Login already exists' }],
      };
    }

    // Check if user with same email exists
    const existingUserByEmail = await this.usersRepository.findByEmail(dto.email);
    if (existingUserByEmail) {
      return {
        success: false,
        errors: [{ field: 'email', message: 'Email already exists' }],
      };
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
      return {
        success: false,
        errors: [{ field: 'code', message: 'Invalid confirmation code' }],
      };
    }

    if (user.isEmailConfirmed) {
      return {
        success: false,
        errors: [{ field: 'code', message: 'Email already confirmed' }],
      };
    }

    const confirmed = user.confirmEmail(code);
    
    if (!confirmed) {
      return {
        success: false,
        errors: [{ field: 'code', message: 'Confirmation code expired or invalid' }],
      };
    }

    await this.usersRepository.save(user);
    return { success: true };
  }

  async resendRegistrationEmail(email: string): Promise<OperationResult> {
    const user = await this.usersRepository.findByEmail(email);
    
    if (!user) {
      return {
        success: false,
        errors: [{ field: 'email', message: 'Email not found' }],
      };
    }

    if (user.isEmailConfirmed) {
      return {
        success: false,
        errors: [{ field: 'email', message: 'Email already confirmed' }],
      };
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
}
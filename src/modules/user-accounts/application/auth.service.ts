import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../../notifications/email.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private confirmationCodes = new Map<string, { email: string; userId: string; confirmed: boolean }>();

  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(loginOrEmail: string, password: string) {
    const user = await this.usersRepository.findByLoginOrEmail(loginOrEmail);
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user._id.toString(),
    };
  }

  async login(loginOrEmail: string, password: string) {
    const user = await this.usersRepository.findByLoginOrEmail(loginOrEmail);
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return null;
    }

    const accessToken = this.jwtService.sign({
      userId: user._id.toString(),
      login: user.login,
    });

    return { accessToken };
  }

  async registerUser(dto: {
    login: string;
    password: string;
    email: string;
  }) {
    // Check if user already exists
    const existingUserByEmail = await this.usersRepository.findByEmail(dto.email);
    const existingUserByLogin = await this.usersRepository.findByLogin(dto.login);

    const errors: { field: string; message: string }[] = [];
    
    if (existingUserByEmail) {
      errors.push({ field: 'email', message: 'Email already exists' });
    }
    
    if (existingUserByLogin) {
      errors.push({ field: 'login', message: 'Login already exists' });
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Create user
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const userId = await this.usersRepository.create({
      login: dto.login,
      email: dto.email,
      passwordHash,
    });

    // Generate confirmation code
    const confirmationCode = uuidv4();
    this.confirmationCodes.set(confirmationCode, {
      email: dto.email,
      userId,
      confirmed: false,
    });

    // Send email
    await this.emailService.sendConfirmationEmail(dto.email, confirmationCode);

    return { success: true };
  }

  async confirmRegistration(code: string) {
    const confirmationData = this.confirmationCodes.get(code);

    if (!confirmationData) {
      return {
        success: false,
        errors: [{ field: 'code', message: 'Invalid confirmation code' }],
      };
    }

    if (confirmationData.confirmed) {
      return {
        success: false,
        errors: [{ field: 'code', message: 'Code already confirmed' }],
      };
    }

    // Mark as confirmed
    confirmationData.confirmed = true;
    await this.usersRepository.confirmEmail(confirmationData.userId);

    return { success: true };
  }

  async resendRegistrationEmail(email: string) {
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

    // Generate new confirmation code
    const confirmationCode = uuidv4();
    this.confirmationCodes.set(confirmationCode, {
      email: email,
      userId: user._id.toString(),
      confirmed: false,
    });

    // Send email
    await this.emailService.sendConfirmationEmail(email, confirmationCode);

    return { success: true };
  }
}
// auth.service.ts

import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { WithId } from "mongodb";
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../infrastructure/users.repository';
import { EmailService } from '../../notifications/email.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { CreateUserDto } from '../dto/create-user.dto';
import { v4 as uuid } from 'uuid';
import { PasswordRecoveryDto } from '../api/input-dto/password-recovery-dto';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenSession } from '../domain/refresh-token.entity';
import { RefreshTokenSessionsRepository } from '../infrastructure/refresh-token-sessions.repository';
import { SecurityDevicesService } from './security-device.service';

export interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  userId: string;
  deviceId: string;
  email: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface OperationResult {
  success: boolean;
  errors?: Array<{ field: string; message: string }>;
}

export interface SessionValidationResult {
    isValid: boolean;
    session?: WithId<RefreshTokenSession>;
    userId?: string;
    error?: 'NOT_FOUND' | 'EXPIRED' | 'REVOKED';
}

export interface RefreshTokensResult {
    accessToken: string;
    refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
    private refreshTokensSessionsRepository: RefreshTokenSessionsRepository,
    private securityDevicesService: SecurityDevicesService,
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

    // CHANGED: Use user.id directly instead of user._id.toString()
    return {
      userId: user.id || user._id?.toString(), // Fallback for compatibility
      login: user.login,
      email: user.email,
    };
  }

  async login(loginOrEmail: string, password: string): Promise<AuthResult> {
    const user = await this.validateUser(loginOrEmail, password);
    
    if (!user) {
      throw new UnauthorizedException({ errorsMessages: [{ field: 'user', message: 'User was not found' }] });
    };

    const payload = { 
      userId: user.userId, 
      login: user.login,
      email: user.email,
      deviceId: uuid(),
    };

    const tokenId = await this.createRefreshSession(payload.userId, payload.deviceId)

    const refreshPayload = {
      ...payload,
      tokenId: tokenId
    }

    const accessToken = this.jwtService.sign(
      payload,
      {
        secret: this.configService.get('AC_SECRET'),
        expiresIn: `${this.configService.get('AC_TIME')}s`
      }
    );

    const refreshToken = this.jwtService.sign(
      refreshPayload,
      {
        secret: this.configService.get('REFRESH_SECRET'),
        expiresIn: `${this.configService.get('REFRESH_TIME')}s`
      }
    );
    
    return {
      success: true,
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: payload.userId,
      deviceId: payload.deviceId,
      email: payload.email,
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

    // CHANGED: user.id might be null check
    if (!user.id) {
      console.error('User found but has no ID');
      return;
    }

    const newConfirmationCode = uuid();

    await this.usersRepository.updateConfirmationCode(user.id, newConfirmationCode);

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

    // CHANGED: Check for user.id
    if (!user.id) {
      throw new BadRequestException('User found but has no ID');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    await this.usersRepository.updatePassword(user.id, newPasswordHash)

    await this.usersRepository.clearRecoveryCode(user.id);
  }

  async refreshTokens(oldRefreshToken: string): Promise<{ accessToken: string, refreshToken: string } | null> {
    try {
      // 1. Verify old refresh token
      const payload = await this.jwtService.verify(oldRefreshToken,
        {
          secret: this.configService.get('REFRESH_SECRET')
        }
      );
      if (!payload) {
        throw new UnauthorizedException();
      }

      // 2. Validate session in DB
      const sessionValidation = await this.validateRefreshSession(payload.tokenId);
      if (!sessionValidation.isValid) {
        throw new UnauthorizedException();
      }

      // 3. Revoke old session
      await this.invalidateRefreshSession(payload.tokenId);

      // 4. Create new session with same deviceId
      const newTokenId = await this.createRefreshSession(payload.userId, payload.deviceId);

      // 5. Create new tokens
      const user = await this.usersRepository.findById(payload.userId);

      if (!user) {
        throw new UnauthorizedException();
      }

      const accessToken = await this.jwtService.signAsync(
        {
          userId: payload.userId,
          login: user.login,
          email: user.email,
        },
        {
          secret: this.configService.get('AC_SECRET'),
          expiresIn: `${this.configService.get('AC_TIME')}s`,
        }
      );

      const secret = this.configService.get('REFRESH_SECRET') || 'refresh-secret-key';
      console.log('Creating refresh token with secret:', secret);

      const refreshToken = await this.jwtService.signAsync(
        {
          userId: payload.userId,
          deviceId: payload.deviceId,
          tokenId: newTokenId,
        },
        {
          secret: this.configService.get('REFRESH_SECRET') || 'refresh-secret-key',
          expiresIn: `${this.configService.get('REFRESH_TIME')}s`,
          jwtid: newTokenId,
        }
      );

      // 6. Update device activity
      await this.securityDevicesService.updateDeviceActivity(payload.deviceId);

      return { accessToken, refreshToken }
    } catch (error) {
      console.log('Refresh tokens failed:', error);
      throw new UnauthorizedException();
    }
  }

  async validateRefreshSession(tokenId: string): Promise<SessionValidationResult> {
    try {
      const session = await this.refreshTokensSessionsRepository.findSessionByTokenId(tokenId);

      if (!session) {
        return { isValid: false, error: 'NOT_FOUND' };
      }

      if (session.isRevoked) {
        return { isValid: false, error: 'REVOKED' };
      }

      if (session.expiresAt < new Date()) {
        return { isValid: false, error: 'EXPIRED' };
      }

      return { isValid: true, session, userId: session.userId };
    } catch (error) {
      console.log('Session validation failed:', error);
      return { isValid: false, error: 'NOT_FOUND' };
    }
  }

  async createRefreshSession(userId: string, deviceId: string): Promise<string> {
    const tokenId = uuid()
    const refreshTime = this.configService.get('REFRESH_TIME')
    const dto = {
      userId,
      deviceId,
      tokenId,
    }

    await this.refreshTokensSessionsRepository.createSession(dto, refreshTime)

    return tokenId
  }

  async invalidateRefreshSession(tokenId: string): Promise<boolean> {
    return await this.refreshTokensSessionsRepository.invalidateSession(tokenId);
  }

  async logout(userId: string, deviceId: string, tokenId: string): Promise<void> {
    try {
      // Handle ALL cleanup in one place
      await Promise.allSettled([
        this.invalidateRefreshSession(tokenId),
        this.securityDevicesService.deleteDevice(userId, deviceId),
      ]);
    } catch (error) {
      // Log but don't throw - logout should always succeed
      console.log('Logout cleanup failed', { userId, deviceId, error });
    }
  }

  async extractDeviceIdFromToken(refreshToken: string): Promise<string> {
    try {
      // Decode without verifying (just to read the payload)
      const decoded = this.jwtService.decode(refreshToken) as any;
      
      if (!decoded || !decoded.deviceId) {
        throw new UnauthorizedException('Invalid token structure');
      }
      
      return decoded.deviceId;
    } catch (error) {
      throw new UnauthorizedException('Failed to extract device ID');
    }
  }
}
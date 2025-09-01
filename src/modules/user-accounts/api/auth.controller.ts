import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  UseGuards,
  Request,
  BadRequestException,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { AuthService } from '../application/auth.service';
import {
  LoginInputDto,
  RegistrationInputDto,
  RegistrationConfirmationInputDto,
  RegistrationEmailResendingInputDto,
} from './input-dto/auth.input-dto';
import { JwtAuthGuard } from '../guards/bearer/jwt.auth-guard';
import { Response } from 'express';
import { PasswordRecoveryDto } from './input-dto/password-recovery-dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { PasswordRecoveryRequestDto } from './input-dto/password-recovery-request-dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginInputDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      loginDto.loginOrEmail,
      loginDto.password,
    );

    if (!result.success) {
      throw new UnauthorizedException();
    }

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: Number(this.configService.get('REFRESH_TIME')) || 24 * 60 * 60 * 1000 // 1 day
    });

    return { accessToken: result.accessToken };
  }

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 10000 } }) // 5 requests per 10 seconds
  async registration(@Body() registrationDto: RegistrationInputDto) {
    const result = await this.authService.registerUser(registrationDto);

    if (!result.success) {
      throw new BadRequestException({
        errorsMessages: result.errors,
      });
    }
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 10000 } }) // 5 requests per 10 seconds
  async confirmRegistration(
    @Body() confirmationDto: RegistrationConfirmationInputDto,
  ) {
    const result = await this.authService.confirmRegistration(
      confirmationDto.code,
    );

    if (!result.success) {
      throw new BadRequestException({
        errorsMessages: result.errors,
      });
    }
  }

  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 10000 } }) // 5 requests per 10 seconds
  async resendRegistrationEmail(
    @Body() resendDto: RegistrationEmailResendingInputDto,
  ) {
    const result = await this.authService.resendRegistrationEmail(
      resendDto.email,
    );

    if (!result.success) {
      throw new BadRequestException({
        errorsMessages: result.errors,
      });
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    return {
      userId: req.user.userId,
      login: req.user.login,
      email: req.user.email,
    };
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 10000 } }) // 5 requests per 10 seconds
  async passwordRecoveryEmail(
    @Body() PasswordRecoveryRequestDto,
  ): Promise<void> {
    return await this.authService.sendPasswordRecoveryEmail(PasswordRecoveryRequestDto)
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 10000 } }) // 5 requests per 10 seconds
  async confirmPasswordRecovery(
    @Body() passwordRecoveryDto: PasswordRecoveryDto
  ): Promise<void> {
    return await this.authService.confirmPasswordRecovery(passwordRecoveryDto)
  }
}
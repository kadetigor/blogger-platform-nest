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
  InternalServerErrorException,
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
import { RefreshTokenGuard } from '../guards/refresh/refresh-token.guard';
import { SecurityDevicesService } from '../application/security-device.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private securityDevicesService: SecurityDevicesService
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginInputDto,
    @Res({ passthrough: true }) res: Response,
    @Request() req,
  ) {
    const header = req.headers['user-agent'] as string;
    const ip = req.ip as string;

    const result = await this.authService.login(
      loginDto.loginOrEmail,
      loginDto.password,
    );

    if (!result.success) {
      throw new UnauthorizedException();
    }

    await this.securityDevicesService.createDeviceWithId(result.userId, result.deviceId, ip, header)

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: Number(this.configService.get('REFRESH_TIME')) || 20 * 1000 // 20 sec
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
    @Body() dto: PasswordRecoveryRequestDto,
  ): Promise<void> {
    return await this.authService.sendPasswordRecoveryEmail(dto.email)
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

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  @Throttle({ default: { limit: 5, ttl: 10000 } })
  async refreshTokens(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    try {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) {
            throw new UnauthorizedException
        }

        const deviceId = await this.authService.extractDeviceIdFromToken(refreshToken);

          if (!deviceId) {
            throw new UnauthorizedException
          }
        
        await this.securityDevicesService.updateDeviceActivity(deviceId);
        
        const result = await this.authService.refreshTokens(refreshToken)
        if (!result) {
            throw new UnauthorizedException
        }

        const { accessToken, refreshToken: newRefreshToken } = result;

        res.cookie('refreshToken', newRefreshToken, {
            maxAge: this.configService.get<number>('REFRESH_TIME', 604800) * 1000,
            httpOnly: true, 
            secure: true, 
            sameSite: 'strict'
        });
        return { accessToken };
    } catch (e: unknown) {
        throw new InternalServerErrorException
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenGuard) // This already verifies the token!
  @Throttle({ default: { limit: 5, ttl: 10000 } })
  async logout(
    @Request() req, // RefreshTokenGuard adds user info here
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    // The guard already verified the token and added user data to req
    const { userId, deviceId, tokenId } = req.user;
    
    // Let the service handle ALL the cleanup
    await this.authService.logout(userId, deviceId, tokenId);
    
    // Clear the cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'strict'
    });
  }
}
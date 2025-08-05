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
  Put,
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

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
      maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
    });

    return { accessToken: result.accessToken };
  }

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
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

  @Put('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecoveryEmail(
    @Body() email: string,
  ): Promise<void> {
    return await this.authService.sendPasswordRecoveryEmail(email)
  }

  @Put('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmPasswordRecovery(
    @Body() passwordRecoveryDto: PasswordRecoveryDto
  ): Promise<void> {
    return await this.authService.confirmPasswordRecovery(passwordRecoveryDto)
  }
}
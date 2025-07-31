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
} from '@nestjs/common';
import { AuthService } from '../application/auth.service';
import {
  LoginInputDto,
  RegistrationInputDto,
  RegistrationConfirmationInputDto,
  RegistrationEmailResendingInputDto,
} from './input-dto/auth.input-dto';
import { JwtAuthGuard } from '../guards/bearer/jwt.auth-guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginInputDto) {
    const result = await this.authService.login(
      loginDto.loginOrEmail,
      loginDto.password,
    );

    if (!result.success) {
      throw new UnauthorizedException();
    }

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
}
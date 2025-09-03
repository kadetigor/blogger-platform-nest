import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from '../../application/auth.service';
import { ConfigService } from '@nestjs/config';
import { SecurityDevicesService } from '../../application/security-device.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,           // Base strategy from passport-jwt
  'jwt-refresh'       // Unique name for this strategy
) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private securityDevicesService: SecurityDevicesService,
) {
    super({
      // 1. Extract token from cookies (not Bearer header)
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const token = req.cookies?.refreshToken;
          console.log('Extracted token from cookie:', token);
          return token;
        }
      ]),
      
      // 2. Secret for verifying refresh tokens
      secretOrKey: configService.get('REFRESH_SECRET') || 'refresh-secret-key',
      
      // 3. Pass the request to validate method
      passReqToCallback: true,
      
      // 4. Don't ignore expiration
      ignoreExpiration: false,
    });
    console.log('JwtRefreshStrategy initialized with secret:', this.configService.get<string>('REFRESH_SECRET'));
  }

  // This method is called AFTER JWT verification succeeds
  async validate(req: Request, payload: any) {
    console.log('Step 3: Strategy validate() called with payload:', payload);
    
    // payload contains the decoded JWT:
    // {
    //   userId: '123',
    //   deviceId: 'abc-def',
    //   tokenId: 'xyz',
    //   iat: 1234567890,
    //   exp: 1234567890
    // }
    
    // const refreshToken = req.cookies?.refreshToken;
    
    // Additional validation beyond JWT signature
    const sessionValid = await this.authService.validateRefreshSession(
      payload.tokenId
    );
    
    if (!sessionValid.isValid) {
      throw new UnauthorizedException('Session invalidated');
    }
    
    // Check if device still exists
    const deviceExists = await this.securityDevicesService.checkDevice(
      payload.userId,
      payload.deviceId
    );
    
    if (!deviceExists) {
      throw new UnauthorizedException('Device not found');
    }
    
    // What you return here becomes req.user
    return {
      userId: payload.userId,
      deviceId: payload.deviceId,
      tokenId: payload.tokenId,
    };
  }
}
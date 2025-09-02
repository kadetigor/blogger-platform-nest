import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  constructor() {
    super();
  }

  canActivate(context: ExecutionContext) {
    console.log('Step 1: RefreshTokenGuard canActivate() called');
    // Calls parent AuthGuard which triggers the strategy
    return super.canActivate(context);
  }

  // Optional: Customize error handling
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    console.log('Step 4: Guard handleRequest() called');
    console.log('User from strategy:', user);
    console.log('Error:', err);
    console.log('Info:', info);
    
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid refresh token');
    }
    
    return user; // This becomes req.user
  }
}
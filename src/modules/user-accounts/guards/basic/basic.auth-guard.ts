import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = request.headers.authorization;

    if (!auth) {
      throw new UnauthorizedException();
    }

    const [type, credentials] = auth.split(' ');

    if (type !== 'Basic') {
      throw new UnauthorizedException();
    }

    const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');

    // You should check these against your actual admin credentials
    if (username === 'admin' && password === 'qwerty') {
      return true;
    }

    throw new UnauthorizedException();
  }
}

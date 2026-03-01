import { USER_SERVICE } from '@/modules/clients/client.module';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { sendToService } from '../utils';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(USER_SERVICE) private readonly client: ClientProxy) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    console.log('Sending token to auth service...');

    const user = await sendToService(
      this.client,
      { cmd: 'auth.validate-token' },
      { token },
    );
    console.log('Token received from JWTAUTHGUARD', token);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    request['user'] = user;
    return true;
  }

  private extractToken(request: Request): string | null {
    const auth = request.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return null;
    }
    return auth.split(' ')[1];
  }
}

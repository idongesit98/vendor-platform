import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';

/**
 * Registration token payload interface
 */
export interface RegistrationTokenPayload {
  sub: string;
  phoneNumber: string;
  step: string;
  type: 'registration';
  iat: number;
  exp: number;
}

/**
 * Registration Guard that protects routes during multi step rgeistration process
 * It does not validate the jwt itself
 * Instead it forwards the token to the user service and the guard attaches the decoded payload to the request
 *
 */

@Injectable()
export class RegistrationTokenGuard implements CanActivate {
  private readonly logger = new Logger(RegistrationTokenGuard.name);

  constructor(
    @Inject('USER_SERVICE') private readonly userService: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Registration token required');
    }

    try {
      const result = await firstValueFrom(
        this.userService.send<{
          valid: boolean;
          payload?: RegistrationTokenPayload;
          error?: string;
        }>({ cmd: 'auth.verify.registration_token' }, { token }),
      );

      if (!result.valid || !result.payload) {
        throw new UnauthorizedException(result.error || 'Invalid token');
      }

      //check expiration (double check, through service should catch it)
      if (result.payload.exp && result.payload.exp * 1000 < Date.now()) {
        throw new UnauthorizedException('Registration token is expired');
      }

      //Attach payload to request for downstream use
      (
        request as Request & { registrationPayload: RegistrationTokenPayload }
      ).registrationPayload = result.payload;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.warn(
        `Invalid registration token: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw new UnauthorizedException('Invalid registration token');
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

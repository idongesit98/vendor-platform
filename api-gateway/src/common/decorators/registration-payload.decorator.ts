import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RegistrationTokenPayload } from '../guards/registration-guard';

export const RegistrationPayload = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RegistrationTokenPayload => {
    const request = ctx.switchToHttp().getRequest<{
      registrationPayload: RegistrationTokenPayload;
    }>();
    return request.registrationPayload;
  },
);

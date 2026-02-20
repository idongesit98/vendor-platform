import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { Logger, RequestTimeoutException } from '@nestjs/common';

export interface MicroserviceCallOptions {
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT = 5000;

/**
 * Sends a request-response message to a microservice.
 * Handles timeout and converts Observable to Promise.
 *
 * @param client - The ClientProxy instance
 * @param pattern - Message pattern (e.g., { cmd: 'auth.login' } or 'auth.login')
 * @param payload - Data to send
 * @param options - Optional configuration
 * @returns Promise resolving to the microservice response
 */

const logger = new Logger('sendToService', { timestamp: true });

export async function sendToService<TResult, TPayload = unknown>(
  client: ClientProxy,
  pattern: Record<string, string> | string,
  payload: TPayload = {} as TPayload,
  options: MicroserviceCallOptions = {},
): Promise<TResult> {
  const { timeoutMs = DEFAULT_TIMEOUT } = options;

  try {
    return await firstValueFrom(
      client.send<TResult>(pattern, payload).pipe(timeout(timeoutMs)),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    logger.error(
      `Failed to reach service - pattern: ${JSON.stringify(pattern)} - ${message}`,
      stack,
    );
    if (error instanceof TimeoutError) {
      throw new RequestTimeoutException('Service did not respond in time');
    }
    throw error;
  }
}

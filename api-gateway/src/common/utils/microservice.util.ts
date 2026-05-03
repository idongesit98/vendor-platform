import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { Logger, RequestTimeoutException } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

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

export const correlationStorage = new AsyncLocalStorage<{
  correlationId: string;
}>();

export async function sendToService<TResult, TPayload = unknown>(
  client: ClientProxy,
  pattern: Record<string, string> | string,
  payload: TPayload = {} as TPayload,
  options: MicroserviceCallOptions = {},
): Promise<TResult> {
  const { timeoutMs = DEFAULT_TIMEOUT } = options;
  const store = correlationStorage.getStore();
  const correlationId = store?.correlationId ?? 'no-correlation-id';

  const enrichedPayload = {
    ...(payload as object),
    _correlationId: correlationId,
  };

  try {
    return await firstValueFrom(
      client.send<TResult>(pattern, enrichedPayload).pipe(timeout(timeoutMs)),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    logger.error(
      `[${correlationId}] Failed - pattern: ${JSON.stringify(pattern)} - ${message}`,
      stack,
    );
    if (error instanceof TimeoutError) {
      throw new RequestTimeoutException('Service did not respond in time');
    }
    throw error;
  }
}

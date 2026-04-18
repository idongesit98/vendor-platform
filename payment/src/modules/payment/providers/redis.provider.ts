import { REDIS_CLIENT } from '@/common/utils';
import { Provider } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (): RedisClient => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const client = new Redis(redisUrl, {
      lazyConnect: false,
      maxRetriesPerRequest: 3,
    });
    return client;
  },
};

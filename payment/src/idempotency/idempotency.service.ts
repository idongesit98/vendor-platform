import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager from 'cache-manager';
import { REDIS_CLIENT } from '@common/utils';
import Redis from 'ioredis';

const KEY_PREFIX = 'idempotency:';
const STATE_PROCESSING = 'processing';
const STATE_FAILED = 'failed';

@Injectable()
export class IdempotencyService implements OnModuleInit {
  private readonly logger = new Logger(IdempotencyService.name, {
    timestamp: true,
  });
  private readonly TTL_SECONDS = 7 * 24 * 60 * 60;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: cacheManager.Cache,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async onModuleInit() {
    const testKey = `${KEY_PREFIX}health-check`;
    try {
      await this.cache.set(testKey, 'working', this.TTL_SECONDS);
      const value = await this.cache.get<string>(testKey);

      if (value !== 'working') {
        this.logger.error('Cache health-check FAILED - value mismatch');
      } else {
        this.logger.log('Redis cache connected and working');
      }

      await this.cache.del(testKey);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Redis cache connection failed: ${message}`);
    }
  }

  async get(key: string): Promise<string | null> {
    const prefixedKey = this.prefix(key);
    try {
      const value = await this.cache.get<string>(prefixedKey);
      return value ?? null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Cache GET failed for ${prefixedKey}: ${message}`);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    const prefixedKey = this.prefix(key);
    try {
      await this.cache.set(prefixedKey, value, this.TTL_SECONDS);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Cache SET failed for ${prefixedKey}: ${message}`);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const prefixedKey = this.prefix(key);

    try {
      await this.cache.del(prefixedKey);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Deleting cache failed for ${prefixedKey}: ${message}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async reserve(key: string): Promise<boolean> {
    const prefixedKey = this.prefix(key);

    try {
      const result = await this.redis.set(
        prefixedKey,
        STATE_PROCESSING,
        'EX',
        this.TTL_SECONDS,
        'NX',
      );
      return result === 'OK' || result === true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Cache reserve failed for key ${key}: ${message}`);
      throw error;
    }
  }

  async markComplete(key: string, paymentId: string): Promise<void> {
    if (!paymentId) {
      this.logger.warn(
        `Mark complete called with empty paymentId for key: ${key}`,
      );
      return;
    }
    await this.set(key, `completed:${paymentId}`);
  }

  async isComplete(key: string): Promise<string | null> {
    const value = await this.get(key);
    if (value?.startsWith('completed:')) {
      const paymentId = value.slice('completed:'.length);
      return paymentId || null;
    }
    return null;
  }

  /**
   * isProcessing — lets callers distinguish "someone is working on it" from
   * "it failed" without parsing raw strings outside this service.
   */
  async isProcessing(key: string): Promise<boolean> {
    return (await this.get(key)) === STATE_PROCESSING;
  }

  /**
   * isFailed — returns true if a previous attempt explicitly marked this key
   * as failed.
   */
  async isFailed(key: string): Promise<boolean> {
    return (await this.get(key)) === STATE_FAILED;
  }

  /**
   * markFailed — explicitly mark a key as failed so retries can go on
   * while still recording that an attempt was made.
   */
  async markFailed(key: string): Promise<void> {
    try {
      await this.set(key, STATE_FAILED);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Mark failed could not set key ${key} to failed - deleting instead + Error ${message}`,
      );
      await this.delete(key);
    }
  }

  async release(key: string): Promise<void> {
    await this.delete(key);
  }

  private prefix(key: string): string {
    return `${KEY_PREFIX}${key}`;
  }
}

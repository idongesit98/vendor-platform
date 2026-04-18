import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager from 'cache-manager';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name, {
    timestamp: true,
  });
  private readonly TTL_SECONDS = 7 * 24 * 60 * 60;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: cacheManager.Cache,
  ) {}

  async onModuleInit() {
    try {
      await this.cache.set('health-check', 'working', this.TTL_SECONDS);
      const value = await this.cache.get('health-check');
      this.logger.log(`Cache test value: ${String(value)}`);

      if (value !== 'working') {
        this.logger.error('Cache is not working correctly');
      } else {
        this.logger.log('Redis cache connected and working');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Redis cache connection failed: ${message}`);
    }
  }

  async get(key: string): Promise<string | null> {
    this.logger.log(`Getting key: idempotency:${key}`);
    try {
      const value = await this.cache.get<string>(`idempotency:${key}`);
      this.logger.log(`Key value: ${String(value)}`);
      return value ?? null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting key idempotency:${key} - ${message}`);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      this.logger.log(`Setting key: idempotency:${key} with value: ${value}`);
      await this.cache.set(`idempotency:${key}`, value, this.TTL_SECONDS);
      this.logger.log(`Key set successfully: idempotency:${key}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting key idempotency: ${key} - ${message}`);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async reserve(key: string): Promise<boolean> {
    const existing = await this.get(key);
    if (existing) return false;
    await this.set(key, 'processing');
    return true;
  }

  async markComplete(key: string, paymentId: string): Promise<void> {
    await this.set(key, `completed:${paymentId}`);
  }

  async isComplete(key: string): Promise<string | null> {
    const value = await this.get(key);
    if (value?.startsWith('completed')) {
      return value.replace('completed:', '');
    }
    return null;
  }

  async delete(key: string): Promise<void> {
    await this.cache.del(`idempotency:${key}`);
  }
}

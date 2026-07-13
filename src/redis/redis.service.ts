import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    const useTls = process.env.REDIS_TLS === 'true' || (redisUrl && redisUrl.startsWith('rediss://'));

    const redisOptions: any = {
      maxRetriesPerRequest: null, // Critical for BullMQ compatibility
    };

    if (useTls) {
      redisOptions.tls = {};
    }

    if (redisUrl) {
      this.client = new Redis(redisUrl, redisOptions);
    } else {
      const host = process.env.REDIS_HOST || 'localhost';
      const port = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;
      const password = process.env.REDIS_PASSWORD || undefined;

      this.client = new Redis({
        host,
        port,
        password,
        ...redisOptions,
      });
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}

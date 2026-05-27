import { Redis } from "ioredis";
import { env } from "../config/env.js";

export class CacheService {
  private redis?: Redis;

  constructor() {
    if (env.redisUrl) {
      this.redis = new Redis(env.redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      if (this.redis.status === "wait") await this.redis.connect();
      const value = await this.redis.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 60) {
    if (!this.redis) return;
    try {
      if (this.redis.status === "wait") await this.redis.connect();
      await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // cache issues should never break the core assignment flow.
    }
  }

  async del(...keys: string[]) {
    if (!this.redis || keys.length === 0) return;
    try {
      if (this.redis.status === "wait") await this.redis.connect();
      await this.redis.del(...keys);
    } catch {
      // best-effort cache invalidation.
    }
  }
}

import { LRUCache } from 'lru-cache';
import { logger } from '../utils/logger.js';

export interface CacheOptions {
  ttl?: number; // Time to live in ms
  max?: number; // Max items in cache
}

export class CacheService {
  private cache: LRUCache<string, any>;
  private hits = 0;
  private misses = 0;

  constructor(options?: CacheOptions) {
    this.cache = new LRUCache<string, any>({
      max: options?.max ?? 1000,
      ttl: options?.ttl ?? 10 * 60 * 1000, // 10 minutes default
    });
  }

  public get<T>(key: string): T | undefined {
    const value = this.cache.get(key) as T | undefined;
    if (value !== undefined) {
      this.hits++;
      logger.debug(`Cache HIT: ${key}`);
      return value;
    }
    this.misses++;
    logger.debug(`Cache MISS: ${key}`);
    return undefined;
  }

  public set<T>(key: string, value: T, ttlMs?: number): void {
    this.cache.set(key, value, { ttl: ttlMs });
    logger.debug(`Cache SET: ${key} (ttl: ${ttlMs ? `${ttlMs / 1000}s` : 'default'})`);
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  public getStats() {
    return {
      size: this.cache.size,
      max: this.cache.max,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)) * 100 : 0,
    };
  }

  /**
   * Helper to get cached value or fetch if missing
   */
  public async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const freshData = await fetchFn();
    if (freshData !== undefined && freshData !== null) {
      this.set(key, freshData, ttlMs);
    }
    return freshData;
  }
}

// Export singleton instance
export const cacheService = new CacheService();

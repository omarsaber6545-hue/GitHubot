import { describe, expect, it } from 'vitest';
import { CacheService } from '../../src/services/cacheService.js';

describe('CacheService', () => {
  it('stores and retrieves items correctly', () => {
    const cache = new CacheService({ ttl: 5000, max: 10 });
    cache.set('test:key', { data: 'hello' });

    expect(cache.has('test:key')).toBe(true);
    expect(cache.get('test:key')).toEqual({ data: 'hello' });
  });

  it('handles misses and tracks statistics', () => {
    const cache = new CacheService({ ttl: 5000, max: 10 });
    cache.set('key1', 123);

    const hit = cache.get('key1');
    const miss = cache.get('key2');

    expect(hit).toBe(123);
    expect(miss).toBeUndefined();

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(50);
  });

  it('fetches on cache miss with getOrFetch', async () => {
    const cache = new CacheService({ ttl: 5000, max: 10 });
    let fetchCount = 0;

    const fetcher = async () => {
      fetchCount++;
      return { value: 42 };
    };

    const first = await cache.getOrFetch('calc', fetcher);
    const second = await cache.getOrFetch('calc', fetcher);

    expect(first).toEqual({ value: 42 });
    expect(second).toEqual({ value: 42 });
    expect(fetchCount).toBe(1); // Only fetched once
  });
});

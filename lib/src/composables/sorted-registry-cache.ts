import type { CheckInItem } from './desk-core';

/**
 * LRU cache for sorted registry results.
 * Avoids recalculating sort on every getAll() call.
 */
export class SortedRegistryCache<T = any> {
  private cache: Map<string, { result: CheckInItem<T>[]; timestamp: number }> = new Map();
  private maxSize = 10; // Keep last 10 sort configurations
  private registryVersion = 0;

  /**
   * Generate cache key from sort options
   */
  private getCacheKey(options?: {
    sortBy?: keyof T | 'timestamp';
    order?: 'asc' | 'desc';
  }): string {
    if (!options?.sortBy) return 'unsorted';
    return `${String(options.sortBy)}-${options.order || 'asc'}`;
  }

  /**
   * Get cached sorted result if valid
   */
  get(options?: {
    sortBy?: keyof T | 'timestamp';
    order?: 'asc' | 'desc';
  }): CheckInItem<T>[] | null {
    const key = this.getCacheKey(options);
    const cached = this.cache.get(key);

    if (!cached) return null;
    if (cached.timestamp < this.registryVersion) return null;

    return cached.result;
  }

  /**
   * Store sorted result in cache
   */
  set(
    result: CheckInItem<T>[],
    options?: { sortBy?: keyof T | 'timestamp'; order?: 'asc' | 'desc' }
  ): void {
    const key = this.getCacheKey(options);

    // LRU: if cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      result,
      timestamp: this.registryVersion,
    });
  }

  /**
   * Invalidate cache (call when registry changes)
   */
  invalidate(): void {
    this.registryVersion++;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.registryVersion = 0;
  }
}

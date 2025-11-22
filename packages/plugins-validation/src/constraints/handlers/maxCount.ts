import type { ConstraintObj } from '../index';

export function maxCountHandler<T>(count: number, children: T[], message?: string): string | null {
  if (children.length >= count) {
    return message || `Maximum count of ${count} exceeded`;
  }
  return null;
}

import type { ConstraintObj } from '../index';

export function immutableHandler<T>(
  key: keyof T,
  data: T,
  original: T | undefined,
  message?: string
): string | null {
  if (!original) return null;
  if (data[key] !== original[key]) {
    return message || `Field ${String(key)} is immutable.`;
  }
  return null;
}

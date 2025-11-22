import type { ConstraintObj } from '../index';

export function maxLengthHandler<T>(
  key: keyof T,
  length: number,
  data: T,
  message?: string
): string | null {
  if (typeof data[key] === 'string' && data[key].length > length) {
    return message || `Field ${String(key)} is too long.`;
  }
  return null;
}

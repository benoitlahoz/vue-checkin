import type { ConstraintObj } from '../index';

export function requiredHandler<T>(key: keyof T, data: T, message?: string): string | null {
  if (data[key] === undefined || data[key] === null || data[key] === '') {
    return message || `Field ${String(key)} is required.`;
  }
  return null;
}

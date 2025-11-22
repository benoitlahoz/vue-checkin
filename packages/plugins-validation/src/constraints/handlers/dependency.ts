import type { ConstraintObj } from '../index';

export function dependencyHandler<T>(
  key: keyof T,
  value: any,
  required: keyof T,
  data: T,
  message?: string
): string | null {
  if (
    data[key] === value &&
    (data[required] === undefined || data[required] === null || data[required] === '')
  ) {
    return message || `Field ${String(required)} is required when ${String(key)} is ${value}.`;
  }
  return null;
}

import type { ConstraintObj } from '../index';

export function uniqueHandler<T>(
  key: keyof T,
  data: T,
  children: T[],
  message?: string
): string | null {
  if (children.some((child: T) => child[key] === data[key])) {
    return message || `Duplicate value for ${String(key)}`;
  }
  return null;
}

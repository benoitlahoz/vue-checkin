import type { ConstraintObj } from '../index';

export function enumHandler<T>(
  key: keyof T,
  values: any[],
  data: T,
  message?: string
): string | null {
  if (!values.includes(data[key])) {
    return message || `Field ${String(key)} must be one of: ${values.join(', ')}.`;
  }
  return null;
}

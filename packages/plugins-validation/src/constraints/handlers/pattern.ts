import type { ConstraintObj } from '../index';

export function patternHandler<T>(
  key: keyof T,
  regex: RegExp,
  data: T,
  message?: string
): string | null {
  if (typeof data[key] === 'string' && !regex.test(data[key])) {
    return message || `Field ${String(key)} does not match pattern.`;
  }
  return null;
}

import type { ConstraintObj } from '../index';

export async function customHandler<T>(
  fn: (child: T, children: T[]) => string | null | Promise<string | null>,
  data: T,
  children: T[],
  message?: string
): Promise<string | null> {
  const result = fn(data, children);
  const resolved = result instanceof Promise ? await result : result;
  return typeof resolved === 'string' && resolved ? message || resolved : null;
}

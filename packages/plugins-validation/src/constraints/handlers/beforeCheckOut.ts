export function beforeCheckOutHandler<T>(
  rule: ((child: T, children: T[]) => string | null) | undefined,
  child: T,
  children: T[],
  message?: string
): string | null {
  if (!rule) return null;
  const result = rule(child, children);
  return typeof result === 'string' && result ? message || result : null;
}

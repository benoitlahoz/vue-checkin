// ...existing code...

export function relationHandler<T>(
  rule: ((child: T, children: T[]) => string | null) | undefined,
  data: T,
  children: T[],
  message?: string
): string | null {
  if (rule) {
    const result = rule(data, children);
    return typeof result === 'string' && result ? message || result : null;
  }
  return null;
}

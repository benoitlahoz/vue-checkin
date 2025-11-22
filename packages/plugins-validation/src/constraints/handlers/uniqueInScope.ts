// ...existing code...

export function uniqueInScopeHandler<T>(
  key: keyof T,
  scopeKey: keyof T,
  data: T,
  children: T[],
  message?: string
): string | null {
  if (children.some((child: T) => child[key] === data[key] && child[scopeKey] === data[scopeKey])) {
    return message || `Value for ${String(key)} must be unique in scope ${String(scopeKey)}.`;
  }
  return null;
}

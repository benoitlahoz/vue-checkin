// ...existing code...

export function relationCountHandler<T>(
  key: keyof T,
  value: any,
  min: number | undefined,
  max: number | undefined,
  children: T[],
  message?: string
): string | null {
  const count = children.filter((child: T) => child[key] === value).length;
  if (typeof min === 'number' && count < min) {
    return message || `Minimum ${min} for ${String(key)}=${value}.`;
  }
  if (typeof max === 'number' && count > max) {
    return message || `Maximum ${max} for ${String(key)}=${value}.`;
  }
  return null;
}

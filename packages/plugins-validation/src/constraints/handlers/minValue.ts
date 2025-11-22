// ...existing code...

export function minValueHandler<T>(
  key: keyof T,
  min: number,
  data: T,
  message?: string
): string | null {
  if (typeof data[key] === 'number' && data[key] < min) {
    return message || `Field ${String(key)} must be at least ${min}.`;
  }
  return null;
}

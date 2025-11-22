// ...existing code...

export function rangeHandler<T>(
  key: keyof T,
  min: number,
  max: number,
  data: T,
  message?: string
): string | null {
  const value = data[key];
  if (typeof value === 'number' && (value < min || value > max)) {
    return message || `Value for ${String(key)} must be between ${min} and ${max}.`;
  }
  return null;
}

export function existsHandler<T>(
  key: keyof T,
  source: any[],
  data: T,
  message?: string
): string | null {
  if (!source.includes(data[key])) {
    return message || `Reference for ${String(key)} does not exist.`;
  }
  return null;
}

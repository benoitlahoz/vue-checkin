// ...existing code...

export function forbiddenHandler<T>(
  key: keyof T,
  values: any[],
  data: T,
  message?: string
): string | null {
  if (values.includes(data[key])) {
    return message || `Value '${data[key]}' for ${String(key)} is forbidden.`;
  }
  return null;
}

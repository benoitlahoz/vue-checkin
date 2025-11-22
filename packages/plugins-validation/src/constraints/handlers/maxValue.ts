// ...existing code...

export function maxValueHandler<T>(
  key: keyof T,
  max: number,
  data: T,
  message?: string
): string | null {
  if (typeof data[key] === 'number' && data[key] > max) {
    return message || `Field ${String(key)} must be at most ${max}.`;
  }
  return null;
}

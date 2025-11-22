// ...existing code...

export function dateRangeHandler<T>(
  key: keyof T,
  min: string | number | Date,
  max: string | number | Date,
  data: T,
  message?: string
): string | null {
  const rawValue = data[key];
  const value = new Date(
    typeof rawValue === 'string' || typeof rawValue === 'number' ? rawValue : String(rawValue)
  );
  const minDate = min instanceof Date ? min : new Date(min);
  const maxDate = max instanceof Date ? max : new Date(max);
  if (isNaN(value.getTime()) || isNaN(minDate.getTime()) || isNaN(maxDate.getTime())) {
    return message ? message : `Invalid date for ${String(key)}.`;
  }
  if (value < minDate || value > maxDate) {
    return message ? message : `Date ${String(key)} out of range.`;
  }
  return null;
}

// ...existing code...

export function conditionalRequiredHandler<T>(
  key: keyof T,
  conditionKey: keyof T,
  conditionValue: any,
  data: T,
  message?: string
): string | null {
  if (
    data[conditionKey] === conditionValue &&
    (data[key] === undefined || data[key] === null || data[key] === '')
  ) {
    return (
      message ||
      `Field ${String(key)} is required when ${String(conditionKey)} is ${conditionValue}.`
    );
  }
  return null;
}

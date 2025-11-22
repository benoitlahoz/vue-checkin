// ...existing code...

export function compareHandler<T>(
  key: keyof T,
  otherKey: keyof T,
  operator: string,
  data: T,
  message?: string
): string | null {
  const a = data[key];
  const b = data[otherKey];
  let valid = false;
  switch (operator) {
    case '<':
      valid = a < b;
      break;
    case '>':
      valid = a > b;
      break;
    case '<=':
      valid = a <= b;
      break;
    case '>=':
      valid = a >= b;
      break;
    case '===':
      valid = a === b;
      break;
    case '!==':
      valid = a !== b;
      break;
    default:
      valid = false;
  }
  if (!valid) {
    return message || `Comparison failed: ${String(key)} ${operator} ${String(otherKey)}`;
  }
  return null;
}

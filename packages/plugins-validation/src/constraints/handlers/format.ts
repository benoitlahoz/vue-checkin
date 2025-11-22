export function formatHandler<T>(
  key: keyof T,
  format: string,
  data: T,
  message?: string
): string | null {
  const value = data[key];
  let valid = true;
  switch (format) {
    case 'email':
      valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value));
      break;
    case 'url':
      valid = /^(https?:\/\/)?([\w\d-]+\.)+[\w\d]{2,}(\/.*)?$/.test(String(value));
      break;
    case 'phone':
      valid = /^\+?[0-9\s-]{7,}$/.test(String(value));
      break;
    default:
      valid = true;
  }
  if (!valid) {
    return message || `Field ${String(key)} is not a valid ${format}.`;
  }
  return null;
}

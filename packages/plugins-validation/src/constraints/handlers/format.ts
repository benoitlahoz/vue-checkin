/**
 * Format: Validates the format of a field (email, url, etc).
 * - key: The field to check.
 * - format: Format type ('email', 'url', 'phone', etc).
 */
import type { ConstraintHandler } from '..';

export const formatHandler: ConstraintHandler = (constraint, data) => {
  const key = (constraint as { key: string | number }).key;
  const format = (constraint as { format: string }).format;
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
    return constraint.message || `Field ${String(key)} is not a valid ${format}.`;
  }
  return null;
};

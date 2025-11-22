/**
 * MaxLength: Requires a string field to have at most a maximum length.
 * - key: The field to check.
 * - length: Maximum allowed length.
 */
import type { ConstraintHandler } from '..';

export const maxLengthHandler: ConstraintHandler = (constraint, data) => {
  const key = (constraint as { key: string | number; length: number }).key;
  const length = (constraint as { length: number }).length;
  if (typeof data[key] === 'string' && data[key].length > length) {
    return constraint.message || `Field ${String(key)} must be at most ${length} characters.`;
  }
  return null;
};

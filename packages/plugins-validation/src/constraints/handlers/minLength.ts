/**
 * MinLength: Requires a string field to have at least a minimum length.
 * - key: The field to check.
 * - length: Minimum required length.
 */
import type { ConstraintHandler } from '..';

export const minLengthHandler: ConstraintHandler = (constraint, data) => {
  const key = (constraint as { key: string | number; length: number }).key;
  const length = (constraint as { length: number }).length;
  if (typeof data[key] === 'string' && data[key].length < length) {
    return constraint.message || `Field ${String(key)} must be at least ${length} characters.`;
  }
  return null;
};

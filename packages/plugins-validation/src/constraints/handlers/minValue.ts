/**
 * MinValue: Requires a numeric field to be at least a minimum value.
 * - key: The field to check.
 * - min: Minimum allowed value.
 */
import type { ConstraintHandler } from '..';

export const minValueHandler: ConstraintHandler = (constraint, data) => {
  const key = (constraint as { key: string | number }).key;
  const min = (constraint as { min: number }).min;
  if (typeof data[key] === 'number' && data[key] < min) {
    return constraint.message || `Field ${String(key)} must be at least ${min}.`;
  }
  return null;
};

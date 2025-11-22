/**
 * MaxValue: Requires a numeric field to be at most a maximum value.
 * - key: The field to check.
 * - max: Maximum allowed value.
 */
import type { ConstraintHandler } from '..';

export const maxValueHandler: ConstraintHandler = (constraint, data) => {
  const key = (constraint as { key: string | number }).key;
  const max = (constraint as { max: number }).max;
  if (typeof data[key] === 'number' && data[key] > max) {
    return constraint.message || `Field ${String(key)} must be at most ${max}.`;
  }
  return null;
};

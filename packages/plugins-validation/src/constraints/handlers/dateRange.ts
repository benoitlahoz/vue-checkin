/**
 * DateRange: Requires a date field to be within a specified range.
 * - key: The date field to check.
 * - min: Minimum allowed date.
 * - max: Maximum allowed date.
 */
import type { ConstraintHandler } from '..';

export const dateRangeHandler: ConstraintHandler = (constraint, data) => {
  const key = (constraint as { key: string | number }).key;
  const min = (constraint as { min: string | number | Date }).min;
  const max = (constraint as { max: string | number | Date }).max;
  const rawValue = data[key];
  const value = new Date(
    typeof rawValue === 'string' || typeof rawValue === 'number' ? rawValue : String(rawValue)
  );
  const minDate = min instanceof Date ? min : new Date(min);
  const maxDate = max instanceof Date ? max : new Date(max);
  if (isNaN(value.getTime()) || isNaN(minDate.getTime()) || isNaN(maxDate.getTime())) {
    return constraint.message ? constraint.message : `Invalid date for ${String(key)}.`;
  }
  if (value < minDate || value > maxDate) {
    return constraint.message ? constraint.message : `Date ${String(key)} out of range.`;
  }
  return null;
};

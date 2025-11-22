import type { ConstraintHandler } from '../index';
import { ConstraintType } from '../index';

export const dateRangeHandler: ConstraintHandler = (constraint, data) => {
  if (constraint.type !== ConstraintType.DateRange) return null;
  const key = constraint.key;
  const min = constraint.min;
  const max = constraint.max;
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
// ...existing code...

// ...existing code...

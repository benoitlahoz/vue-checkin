/**
 * RelationCount: Enforces a minimum/maximum count of children with a specific field value.
 * - key: The field to check.
 * - value: The value to count.
 * - min: Minimum required count.
 * - max: Maximum allowed count.
 */
import type { ConstraintHandler } from '..';

export const relationCountHandler: ConstraintHandler = (constraint, _data, children) => {
  const key = (constraint as { key: string | number }).key;
  const value = (constraint as { value: any }).value;
  const min = (constraint as { min?: number }).min;
  const max = (constraint as { max?: number }).max;
  const count = children.filter((child: any) => child[key] === value).length;
  if (typeof min === 'number' && count < min) {
    return constraint.message || `Minimum ${min} for ${String(key)}=${value}.`;
  }
  if (typeof max === 'number' && count > max) {
    return constraint.message || `Maximum ${max} for ${String(key)}=${value}.`;
  }
  return null;
};

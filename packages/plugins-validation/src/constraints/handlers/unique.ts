/**
 * Unique: Ensures the value of a given key is unique among all children.
 * - key: The field to check for uniqueness.
 */
import type { ConstraintHandler } from '..';

export const uniqueHandler: ConstraintHandler = (constraint, data, children) => {
  const key = (constraint as { key: string | number }).key;
  if (children.some((child: any) => child[key] === data[key])) {
    return constraint.message || `Duplicate value for ${String(key)}`;
  }
  return null;
};

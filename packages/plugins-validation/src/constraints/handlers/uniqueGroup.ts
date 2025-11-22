/**
 * UniqueGroup: Ensures a combination of fields is unique among all children.
 * - keys: Array of fields to check for unique combination.
 */
import type { ConstraintHandler } from '..';

export const uniqueGroupHandler: ConstraintHandler = (constraint, data, children) => {
  const keys = (constraint as { keys: (string | number)[] }).keys;
  if (children.some((child: any) => keys.every((k: any) => child[k] === data[k]))) {
    return constraint.message || `Combination of ${keys.join('+')} must be unique.`;
  }
  return null;
};

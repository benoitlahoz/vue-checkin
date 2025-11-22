/**
 * MaxCount: Limits the total number of children in the collection.
 * - count: Maximum allowed number of children.
 */
import type { ConstraintHandler } from '..';

export const maxCountHandler: ConstraintHandler = (constraint, _data, children) => {
  if ('count' in constraint) {
    const count = constraint.count;
    if (children.length >= count) {
      return constraint.message || `Maximum count of ${count} exceeded`;
    }
  }
  return null;
};

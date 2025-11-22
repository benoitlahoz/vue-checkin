import type { ConstraintHandler } from '../index';
import { ConstraintType } from '../index';

export const uniqueGroupHandler: ConstraintHandler = (constraint, data, children) => {
  if (constraint.type !== ConstraintType.UniqueGroup) return null;
  const keys = constraint.keys;
  if (children.some((child: any) => keys.every((k: any) => child[k] === data[k]))) {
    return constraint.message || `Combination of ${keys.join('+')} must be unique.`;
  }
  return null;
};

// ...existing code...

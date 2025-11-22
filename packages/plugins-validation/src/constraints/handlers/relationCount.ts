// ...existing code...

// ...existing code...
import type { ConstraintHandler } from '../index';
import { ConstraintType } from '../index';

export const relationCountHandler: ConstraintHandler = (constraint, _data, children) => {
  if (constraint.type !== ConstraintType.RelationCount) return null;
  const key = constraint.key;
  const value = constraint.value;
  const min = constraint.min;
  const max = constraint.max;
  const count = children.filter((child: any) => child[key] === value).length;
  if (typeof min === 'number' && count < min) {
    return constraint.message || `Minimum ${min} for ${String(key)}=${value}.`;
  }
  if (typeof max === 'number' && count > max) {
    return constraint.message || `Maximum ${max} for ${String(key)}=${value}.`;
  }
  return null;
};

import type { ConstraintHandler } from '../index';
import { ConstraintType } from '../index';

export const minValueHandler: ConstraintHandler = (constraint, data) => {
  if (constraint.type !== ConstraintType.MinValue) return null;
  const key = constraint.key;
  const min = constraint.min;
  if (typeof data[key] === 'number' && data[key] < min) {
    return constraint.message || `Field ${String(key)} must be at least ${min}.`;
  }
  return null;
};

// ...existing code...

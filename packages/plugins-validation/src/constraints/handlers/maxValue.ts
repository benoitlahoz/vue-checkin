import type { ConstraintHandler } from '../index';
import { ConstraintType } from '../index';

export const maxValueHandler: ConstraintHandler = (constraint, data) => {
  if (constraint.type !== ConstraintType.MaxValue) return null;
  const key = constraint.key;
  const max = constraint.max;
  if (typeof data[key] === 'number' && data[key] > max) {
    return constraint.message || `Field ${String(key)} must be at most ${max}.`;
  }
  return null;
};

// ...existing code...

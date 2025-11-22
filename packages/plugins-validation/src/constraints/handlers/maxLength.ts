import type { ConstraintHandler } from '../index';
import { ConstraintType } from '../index';

export const maxLengthHandler: ConstraintHandler = (constraint, data) => {
  if (constraint.type !== ConstraintType.MaxLength) return null;
  const key = constraint.key;
  const length = constraint.length;
  if (typeof data[key] === 'string' && data[key].length > length) {
    return constraint.message || `Field ${String(key)} must be at most ${length} characters.`;
  }
  return null;
};

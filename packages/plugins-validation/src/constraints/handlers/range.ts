// ...existing code...

import type { ConstraintHandler } from '../index';

import { ConstraintType } from '../index';
export const rangeHandler: ConstraintHandler = (constraint, data) => {
  if (constraint.type !== ConstraintType.Range) return null;
  const key = constraint.key;
  const min = constraint.min;
  const max = constraint.max;
  const value = data[key];
  if (typeof value === 'number' && (value < min || value > max)) {
    return constraint.message || `Value for ${String(key)} must be between ${min} and ${max}.`;
  }
  return null;
};

import type { ConstraintHandler } from '../index';

import { ConstraintType } from '../index';
export const requiredHandler: ConstraintHandler = (constraint, data) => {
  if (constraint.type !== ConstraintType.Required) return null;
  const key = constraint.key;
  if (data[key] === undefined || data[key] === null || data[key] === '') {
    return constraint.message || `Field ${String(key)} is required.`;
  }
  return null;
};

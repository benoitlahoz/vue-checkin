import type { ConstraintObj } from '../index';

import type { ConstraintHandler } from '../index';

import { ConstraintType } from '../index';
export const maxCountHandler: ConstraintHandler = (constraint, _data, children) => {
  if (constraint.type !== ConstraintType.MaxCount) return null;
  const count = constraint.count;
  if (children.length >= count) {
    return constraint.message || `Maximum count of ${count} exceeded`;
  }
  return null;
};

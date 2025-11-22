import type { ConstraintObj } from '../index';

import type { ConstraintHandler } from '../index';

import { ConstraintType } from '../index';
export const uniqueHandler: ConstraintHandler = (constraint, data, children) => {
  if (constraint.type !== ConstraintType.Unique) return null;
  const key = constraint.key;
  if (children.some((child: any) => child[key] === data[key])) {
    return constraint.message || `Duplicate value for ${String(key)}`;
  }
  return null;
};

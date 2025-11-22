import type { ConstraintHandler } from '../index';
import { ConstraintType } from '../index';

export const beforeCheckOutHandler: ConstraintHandler = (constraint, data, children) => {
  if (constraint.type !== ConstraintType.BeforeCheckOut) return null;
  const rule = constraint.rule;
  if (!rule) return null;
  const result = rule(data, children);
  return typeof result === 'string' && result ? constraint.message || result : null;
};

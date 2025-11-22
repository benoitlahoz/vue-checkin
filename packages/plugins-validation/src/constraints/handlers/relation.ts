import type { ConstraintHandler } from '../index';
import { ConstraintType } from '../index';

export const relationHandler: ConstraintHandler = (constraint, data, children) => {
  if (constraint.type !== ConstraintType.Relation) return null;
  const rule = constraint.rule;
  if (rule) {
    const result = rule(data, children);
    return typeof result === 'string' && result ? constraint.message || result : null;
  }
  return null;
};

// ...existing code...

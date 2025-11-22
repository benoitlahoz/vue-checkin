import type { ConstraintHandler } from '../index';
import { ConstraintType } from '../index';

export const patternHandler: ConstraintHandler = (constraint, data) => {
  if (constraint.type !== ConstraintType.Pattern) return null;
  const key = constraint.key;
  const regex = constraint.regex;
  if (typeof data[key] === 'string' && !regex.test(data[key])) {
    return constraint.message || `Field ${String(key)} does not match pattern.`;
  }
  return null;
};

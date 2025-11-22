import type { ConstraintHandler } from '../index';
import { ConstraintType } from '../index';

export const customHandler: ConstraintHandler = async (constraint, data, children) => {
  if (constraint.type !== ConstraintType.Custom) return null;
  const fn = constraint.fn;
  const result = fn(data, children);
  const resolved = result instanceof Promise ? await result : result;
  return typeof resolved === 'string' && resolved ? constraint.message || resolved : null;
};

/**
 * Relation: Custom relation rule between child and collection, via a function.
 * - rule: Function to validate relation.
 */
import type { ConstraintHandler } from '..';

export const relationHandler: ConstraintHandler = (constraint, data, children) => {
  if ('rule' in constraint && typeof constraint.rule === 'function') {
    const result = constraint.rule(data, children);
    return typeof result === 'string' && result ? constraint.message || result : null;
  }
  return null;
};

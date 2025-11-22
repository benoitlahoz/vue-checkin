/**
 * BeforeCheckOut: Custom rule to block removal (check-out) of an item.
 * - rule: Function to validate removal.
 */
import type { ConstraintHandler } from '..';

export const beforeCheckOutHandler: ConstraintHandler = (constraint, data, children) => {
  if ('rule' in constraint && typeof constraint.rule === 'function') {
    const result = constraint.rule(data, children);
    return typeof result === 'string' && result ? constraint.message || result : null;
  }
  return null;
};

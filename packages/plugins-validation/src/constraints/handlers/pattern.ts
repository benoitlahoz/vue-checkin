/**
 * Pattern: Requires a field to match a given regular expression.
 * - key: The field to check.
 * - regex: The regular expression to match.
 */
import type { ConstraintHandler } from '..';

export const patternHandler: ConstraintHandler = (constraint, data) => {
  const key = (constraint as { key: string | number }).key;
  const regex = (constraint as { regex: RegExp }).regex;
  if (typeof data[key] === 'string' && !regex.test(data[key])) {
    return constraint.message || `Field ${String(key)} does not match pattern.`;
  }
  return null;
};

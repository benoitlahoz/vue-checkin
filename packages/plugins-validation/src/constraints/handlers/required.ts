/**
 * Required: Requires a field to be present and non-empty.
 * - key: The field to check for presence.
 */
import type { ConstraintHandler } from '..';

export const requiredHandler: ConstraintHandler = (constraint, data) => {
  const key = (constraint as { key: string | number }).key;
  if (data[key] === undefined || data[key] === null || data[key] === '') {
    return constraint.message || `Field ${String(key)} is required.`;
  }
  return null;
};

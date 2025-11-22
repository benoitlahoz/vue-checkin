/**
 * Forbidden: Forbids certain values or combinations.
 * - key: The field to check.
 * - values: Forbidden values.
 */
import type { ConstraintHandler } from '..';

export const forbiddenHandler: ConstraintHandler = (constraint, data) => {
  const key = (constraint as { key: string | number }).key;
  const values = (constraint as { values: any[] }).values;
  if (values.includes(data[key])) {
    return constraint.message || `Value '${data[key]}' for ${String(key)} is forbidden.`;
  }
  return null;
};

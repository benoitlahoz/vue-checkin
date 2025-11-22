/**
 * Dependency: Requires another field to be present if a given field has a specific value.
 * - key: The field to check for value.
 * - value: The value that triggers dependency.
 * - required: The dependent field that must be present.
 */
import type { ConstraintHandler } from '..';

export const dependencyHandler: ConstraintHandler = (constraint, data) => {
  const key = (constraint as { key: string | number }).key;
  const value = (constraint as { value: any }).value;
  const required = (constraint as { required: string | number }).required;
  if (
    data[key] === value &&
    (data[required] === undefined || data[required] === null || data[required] === '')
  ) {
    return (
      constraint.message || `Field ${String(required)} is required when ${String(key)} is ${value}.`
    );
  }
  return null;
};

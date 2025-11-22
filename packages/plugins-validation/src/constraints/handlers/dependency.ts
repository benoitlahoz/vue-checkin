import type { ConstraintHandler } from '../index';
import { ConstraintType } from '../index';

export const dependencyHandler: ConstraintHandler = (constraint, data) => {
  if (constraint.type !== ConstraintType.Dependency) return null;
  const key = constraint.key;
  const value = constraint.value;
  const required = constraint.required;
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

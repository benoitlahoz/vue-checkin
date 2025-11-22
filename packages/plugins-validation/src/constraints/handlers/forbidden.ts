// ...existing code...

import type { ConstraintHandler } from '../index';

import { ConstraintType } from '../index';
export const forbiddenHandler: ConstraintHandler = (constraint, data) => {
  if (constraint.type !== ConstraintType.Forbidden) return null;
  const key = constraint.key;
  const values = constraint.values;
  if (values.includes(data[key])) {
    return constraint.message || `Value '${data[key]}' for ${String(key)} is forbidden.`;
  }
  return null;
};

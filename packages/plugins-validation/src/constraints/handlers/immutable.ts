import type { ConstraintHandler } from '../index';
import { ConstraintType } from '../index';

export const immutableHandler: ConstraintHandler = (constraint, data, _children, deskInstance) => {
  if (constraint.type !== ConstraintType.Immutable) return null;
  const key = constraint.key;
  let original: any = undefined;
  if (deskInstance && deskInstance.getById) {
    const found = deskInstance.getById(data.id);
    if (found && found.data) original = found.data;
  }
  if (!original) return null;
  if (data[key] !== original[key]) {
    return constraint.message || `Field ${String(key)} is immutable.`;
  }
  return null;
};

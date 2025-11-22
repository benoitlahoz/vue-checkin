/**
 * Immutable: Prevents modification of a field after creation.
 * - key: The field to protect.
 */
import type { ConstraintHandler } from '..';

export const immutableHandler: ConstraintHandler = (constraint, data, _children, deskInstance) => {
  const key = (constraint as { key: string | number }).key;
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

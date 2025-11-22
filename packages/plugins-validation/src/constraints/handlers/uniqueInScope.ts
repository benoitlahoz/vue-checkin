/**
 * UniqueInScope: Ensures uniqueness within a sub-scope/group.
 * - key: The field to check.
 * - scopeKey: The field defining the scope/group.
 */
import type { ConstraintHandler } from '..';

export const uniqueInScopeHandler: ConstraintHandler = (constraint, data, children) => {
  const key = (constraint as { key: string | number }).key;
  const scopeKey = (constraint as { scopeKey: string | number }).scopeKey;
  if (
    children.some((child: any) => child[key] === data[key] && child[scopeKey] === data[scopeKey])
  ) {
    return (
      constraint.message || `Value for ${String(key)} must be unique in scope ${String(scopeKey)}.`
    );
  }
  return null;
};

import type { ConstraintHandler } from '../index';
import { ConstraintType } from '../index';

export const uniqueInScopeHandler: ConstraintHandler = (constraint, data, children) => {
  if (constraint.type !== ConstraintType.UniqueInScope) return null;
  const key = constraint.key;
  const scopeKey = constraint.scopeKey;
  if (
    children.some((child: any) => child[key] === data[key] && child[scopeKey] === data[scopeKey])
  ) {
    return (
      constraint.message || `Value for ${String(key)} must be unique in scope ${String(scopeKey)}.`
    );
  }
  return null;
};

import type { ConstraintHandler } from '../index';
import { ConstraintType } from '../index';

// ...existing code...

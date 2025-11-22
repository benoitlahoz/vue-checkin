import type { ConstraintHandler } from '../index';
import { ConstraintType } from '../index';

export const compareHandler: ConstraintHandler = (constraint, data) => {
  if (constraint.type !== ConstraintType.Compare) return null;
  const key = constraint.key;
  const otherKey = constraint.otherKey;
  const operator = constraint.operator;
  const a = data[key];
  const b = data[otherKey];
  let valid = false;
  switch (operator) {
    case '<':
      valid = a < b;
      break;
    case '>':
      valid = a > b;
      break;
    case '<=':
      valid = a <= b;
      break;
    case '>=':
      valid = a >= b;
      break;
    case '===':
      valid = a === b;
      break;
    case '!==':
      valid = a !== b;
      break;
    default:
      valid = false;
  }
  if (!valid) {
    return (
      constraint.message || `Comparison failed: ${String(key)} ${operator} ${String(otherKey)}`
    );
  }
  return null;
};

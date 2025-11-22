import type { ConstraintHandler } from '../index';
import { ConstraintType } from '../index';

export const conditionalRequiredHandler: ConstraintHandler = (constraint, data) => {
  if (constraint.type !== ConstraintType.ConditionalRequired) return null;
  const key = constraint.key;
  const conditionKey = constraint.conditionKey;
  const conditionValue = constraint.conditionValue;
  if (
    data[conditionKey] === conditionValue &&
    (data[key] === undefined || data[key] === null || data[key] === '')
  ) {
    return (
      constraint.message ||
      `Field ${String(key)} is required when ${String(conditionKey)} is ${conditionValue}.`
    );
  }
  return null;
};

// ...existing code...

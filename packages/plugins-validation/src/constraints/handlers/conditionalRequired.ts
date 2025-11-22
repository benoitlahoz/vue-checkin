/**
 * ConditionalRequired: Requires a field if a condition on another field is met.
 * - key: The field to require.
 * - conditionKey: The field to check condition on.
 * - conditionValue: The value that triggers requirement.
 */
import type { ConstraintHandler } from '..';

export const conditionalRequiredHandler: ConstraintHandler = (constraint, data) => {
  const key = (constraint as { key: string | number }).key;
  const conditionKey = (constraint as { conditionKey: string | number }).conditionKey;
  const conditionValue = (constraint as { conditionValue: any }).conditionValue;
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

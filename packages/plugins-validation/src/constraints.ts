import { ref } from 'vue';
import type { CheckInPlugin } from 'vue-airport';

export type ConstraintFn<T = any> = (child: T, children: T[]) => string | null;

/**
 * ConstraintType enumerates all supported constraint types for desk validation.
 * Each type enforces a specific business rule or data integrity check.
 */
export enum ConstraintType {
  /** Allows custom validation logic, sync or async. */
  Custom = 'custom',
  /** Ensures a numeric field is within a given range. */
  Range = 'range',
  /** Prevents modification of a field after creation. */
  Immutable = 'immutable',
  /** Forbids certain values or combinations. */
  Forbidden = 'forbidden',
  /** Compares two fields with a given operator. */
  Compare = 'compare',
  /** Requires a field if a condition on another field is met. */
  ConditionalRequired = 'conditionalRequired',
  /** Validates the format of a field (email, url, etc). */
  Format = 'format',
  /** Requires a numeric field to be at least a minimum value. */
  MinValue = 'minValue',
  /** Requires a numeric field to be at most a maximum value. */
  MaxValue = 'maxValue',
  /** Ensures uniqueness within a sub-scope/group. */
  UniqueInScope = 'uniqueInScope',
  /** Checks that a reference exists in another collection. */
  Exists = 'exists',
  /** Ensures the value of a given key is unique among all children. */
  Unique = 'unique',
  /** Limits the total number of children in the collection. */
  MaxCount = 'maxCount',
  /** Custom relation rule between child and collection, via a function. */
  Relation = 'relation',
  /** Custom rule to block removal (check-out) of an item. */
  BeforeCheckOut = 'beforeCheckOut',
  /** Requires a field to be present and non-empty. */
  Required = 'required',
  /** Requires a field to match a given regular expression. */
  Pattern = 'pattern',
  /** Requires a string field to have at least a minimum length. */
  MinLength = 'minLength',
  /** Requires a string field to have at most a maximum length. */
  MaxLength = 'maxLength',
  /** Requires a field to be one of a set of allowed values. */
  Enum = 'enum',
  /** Enforces a minimum/maximum count of children with a specific field value. */
  RelationCount = 'relationCount',
  /** Ensures a combination of fields is unique among all children. */
  UniqueGroup = 'uniqueGroup',
  /** Requires a date field to be within a specified range. */
  DateRange = 'dateRange',
  /** Requires another field to be present if a given field has a specific value. */
  Dependency = 'dependency',
}
/**
 * ConstraintObj describes the configuration for each constraint type.
 * Each variant documents its expected properties and validation behavior.
 */
export type ConstraintObj<T = any> =
  /**
   * Custom: Allows custom validation logic, sync or async.
   * - fn: Validation function, can return string | null or Promise<string | null>.
   */
  | {
      type: ConstraintType.Custom;
      fn: (child: T, children: T[]) => string | null | Promise<string | null>;
      message?: string;
    }
  /**
   * Range: Ensures a numeric field is within a given range.
   * - key: The field to check.
   * - min: Minimum allowed value.
   * - max: Maximum allowed value.
   */
  | { type: ConstraintType.Range; key: keyof T; min: number; max: number; message?: string }
  /**
   * Immutable: Prevents modification of a field after creation.
   * - key: The field to protect.
   */
  | { type: ConstraintType.Immutable; key: keyof T; message?: string }
  /**
   * Forbidden: Forbids certain values or combinations.
   * - key: The field to check.
   * - values: Forbidden values.
   */
  | { type: ConstraintType.Forbidden; key: keyof T; values: any[]; message?: string }
  /**
   * Compare: Compares two fields with a given operator.
   * - key: The first field.
   * - otherKey: The second field.
   * - operator: Comparison operator ('<', '>', '<=', '>=', '===', '!==').
   */
  | {
      type: ConstraintType.Compare;
      key: keyof T;
      otherKey: keyof T;
      operator: string;
      message?: string;
    }
  /**
   * ConditionalRequired: Requires a field if a condition on another field is met.
   * - key: The field to require.
   * - conditionKey: The field to check condition on.
   * - conditionValue: The value that triggers requirement.
   */
  | {
      type: ConstraintType.ConditionalRequired;
      key: keyof T;
      conditionKey: keyof T;
      conditionValue: any;
      message?: string;
    }
  /**
   * Format: Validates the format of a field (email, url, etc).
   * - key: The field to check.
   * - format: Format type ('email', 'url', 'phone', etc).
   */
  | { type: ConstraintType.Format; key: keyof T; format: string; message?: string }
  /**
   * MinValue: Requires a numeric field to be at least a minimum value.
   * - key: The field to check.
   * - min: Minimum allowed value.
   */
  | { type: ConstraintType.MinValue; key: keyof T; min: number; message?: string }
  /**
   * MaxValue: Requires a numeric field to be at most a maximum value.
   * - key: The field to check.
   * - max: Maximum allowed value.
   */
  | { type: ConstraintType.MaxValue; key: keyof T; max: number; message?: string }
  /**
   * UniqueInScope: Ensures uniqueness within a sub-scope/group.
   * - key: The field to check.
   * - scopeKey: The field defining the scope/group.
   */
  | { type: ConstraintType.UniqueInScope; key: keyof T; scopeKey: keyof T; message?: string }
  /**
   * Exists: Checks that a reference exists in another collection.
   * - key: The field to check.
   * - source: Array of valid values.
   */
  | { type: ConstraintType.Exists; key: keyof T; source: any[]; message?: string }
  /**
   * Unique: Ensures the value of a given key is unique among all children.
   * - key: The field to check for uniqueness.
   */
  | { type: ConstraintType.Unique; key: keyof T; message?: string }
  /**
   * MaxCount: Limits the total number of children in the collection.
   * - count: Maximum allowed number of children.
   */
  | { type: ConstraintType.MaxCount; count: number; message?: string }
  /**
   * Relation: Custom relation rule between child and collection, via a function.
   * - rule: Function to validate relation.
   */
  | { type: ConstraintType.Relation; rule: ConstraintFn<T>; message?: string }
  /**
   * BeforeCheckOut: Custom rule to block removal (check-out) of an item.
   * - rule: Function to validate removal.
   */
  | { type: ConstraintType.BeforeCheckOut; rule: ConstraintFn<T>; message?: string }
  /**
   * Required: Requires a field to be present and non-empty.
   * - key: The field to check for presence.
   */
  | { type: ConstraintType.Required; key: keyof T; message?: string }
  /**
   * Pattern: Requires a field to match a given regular expression.
   * - key: The field to check.
   * - regex: The regular expression to match.
   */
  | { type: ConstraintType.Pattern; key: keyof T; regex: RegExp; message?: string }
  /**
   * MinLength: Requires a string field to have at least a minimum length.
   * - key: The field to check.
   * - length: Minimum required length.
   */
  | { type: ConstraintType.MinLength; key: keyof T; length: number; message?: string }
  /**
   * MaxLength: Requires a string field to have at most a maximum length.
   * - key: The field to check.
   * - length: Maximum allowed length.
   */
  | { type: ConstraintType.MaxLength; key: keyof T; length: number; message?: string }
  /**
   * Enum: Requires a field to be one of a set of allowed values.
   * - key: The field to check.
   * - values: Allowed values.
   */
  | { type: ConstraintType.Enum; key: keyof T; values: any[]; message?: string }
  /**
   * RelationCount: Enforces a minimum/maximum count of children with a specific field value.
   * - key: The field to check.
   * - value: The value to count.
   * - min: Minimum required count.
   * - max: Maximum allowed count.
   */
  | {
      type: ConstraintType.RelationCount;
      key: keyof T;
      value: any;
      min?: number;
      max?: number;
      message?: string;
    }
  /**
   * UniqueGroup: Ensures a combination of fields is unique among all children.
   * - keys: Array of fields to check for unique combination.
   */
  | { type: ConstraintType.UniqueGroup; keys: (keyof T)[]; message?: string }
  /**
   * DateRange: Requires a date field to be within a specified range.
   * - key: The date field to check.
   * - min: Minimum allowed date.
   * - max: Maximum allowed date.
   */
  | {
      type: ConstraintType.DateRange;
      key: keyof T;
      min: string | Date;
      max: string | Date;
      message?: string;
    }
  /**
   * Dependency: Requires another field to be present if a given field has a specific value.
   * - key: The field to check for value.
   * - value: The value that triggers dependency.
   * - required: The dependent field that must be present.
   */
  | {
      type: ConstraintType.Dependency;
      key: keyof T;
      value: any;
      required: keyof T;
      message?: string;
    };

export type Constraint<T = any> = ConstraintFn<T> | ConstraintObj<T>;

export interface ConstraintError {
  id: string | number;
  errors: string[];
  timestamp: number;
}

export function createConstraintsPlugin<T extends Record<string, any> = any>(
  constraints: Constraint<T>[]
): CheckInPlugin<T> {
  const constraintErrors = ref<ConstraintError[]>([]);

  const addErrors = (id: string | number, errors: string[]) => {
    constraintErrors.value.push({ id, errors, timestamp: Date.now() });
  };
  const removeErrorsForId = (id: string | number) => {
    constraintErrors.value = constraintErrors.value.filter((e) => e.id !== id);
  };

  const emitToDevTools = (action: string, id: string | number, errors: string[]) => {
    if (deskInstance && deskInstance.devTools && deskInstance.__deskId) {
      deskInstance.devTools.emit({
        type: 'plugin-execute',
        timestamp: Date.now(),
        deskId: deskInstance.__deskId,
        childId: id,
        pluginName: 'constraints',
        data: {
          action,
          errorCount: errors.length,
          hasErrors: errors.length > 0,
          errors,
        },
      });
    }
  };

  async function validateData(id: string | number, data: T, children: T[]): Promise<boolean> {
    removeErrorsForId(id);
    const errors: string[] = [];
    for (const constraint of constraints) {
      if (typeof constraint === 'function') {
        const result = constraint(data, children);
        if (typeof result === 'string' && result) errors.push(result);
      } else {
        switch (constraint.type) {
          case ConstraintType.Custom: {
            const c = constraint as Extract<ConstraintObj<T>, { type: ConstraintType.Custom }>;
            const result = c.fn(data, children);
            const resolved = result instanceof Promise ? await result : result;
            if (typeof resolved === 'string' && resolved) errors.push(resolved);
            break;
          }
          case ConstraintType.Unique: {
            const c = constraint as Extract<ConstraintObj<T>, { type: ConstraintType.Unique }>;
            if (children.some((child: T) => child[c.key] === data[c.key])) {
              errors.push(c.message || `Duplicate value for ${String(c.key)}`);
            }
            break;
          }
          case ConstraintType.MaxCount: {
            const c = constraint as Extract<ConstraintObj<T>, { type: ConstraintType.MaxCount }>;
            if (children.length >= c.count) {
              errors.push(c.message || `Maximum count of ${c.count} exceeded`);
            }
            break;
          }
          case ConstraintType.Required: {
            const c = constraint as Extract<ConstraintObj<T>, { type: ConstraintType.Required }>;
            if (data[c.key] === undefined || data[c.key] === null || data[c.key] === '') {
              errors.push(c.message || `Field ${String(c.key)} is required.`);
            }
            break;
          }
          case ConstraintType.Pattern: {
            const c = constraint as Extract<ConstraintObj<T>, { type: ConstraintType.Pattern }>;
            if (typeof data[c.key] === 'string' && !c.regex.test(data[c.key])) {
              errors.push(c.message || `Field ${String(c.key)} does not match pattern.`);
            }
            break;
          }
          case ConstraintType.MinLength: {
            const c = constraint as Extract<ConstraintObj<T>, { type: ConstraintType.MinLength }>;
            if (typeof data[c.key] === 'string' && data[c.key].length < c.length) {
              errors.push(c.message || `Field ${String(c.key)} is too short.`);
            }
            break;
          }
          case ConstraintType.MaxLength: {
            const c = constraint as Extract<ConstraintObj<T>, { type: ConstraintType.MaxLength }>;
            if (typeof data[c.key] === 'string' && data[c.key].length > c.length) {
              errors.push(c.message || `Field ${String(c.key)} is too long.`);
            }
            break;
          }
          case ConstraintType.Enum: {
            const c = constraint as Extract<ConstraintObj<T>, { type: ConstraintType.Enum }>;
            if (!c.values.includes(data[c.key])) {
              errors.push(
                c.message || `Field ${String(c.key)} must be one of: ${c.values.join(', ')}.`
              );
            }
            break;
          }
          case ConstraintType.RelationCount: {
            const c = constraint as Extract<
              ConstraintObj<T>,
              { type: ConstraintType.RelationCount }
            >;
            const count = children.filter((child: T) => child[c.key] === c.value).length;
            if (typeof c.min === 'number' && count < c.min) {
              errors.push(c.message || `Minimum ${c.min} for ${String(c.key)}=${c.value}.`);
            }
            if (typeof c.max === 'number' && count > c.max) {
              errors.push(c.message || `Maximum ${c.max} for ${String(c.key)}=${c.value}.`);
            }
            break;
          }
          case ConstraintType.UniqueGroup: {
            const c = constraint as Extract<ConstraintObj<T>, { type: ConstraintType.UniqueGroup }>;
            if (children.some((child: T) => c.keys.every((k) => child[k] === data[k]))) {
              errors.push(c.message || `Combination of ${c.keys.join('+')} must be unique.`);
            }
            break;
          }
          case ConstraintType.DateRange: {
            const c = constraint as Extract<ConstraintObj<T>, { type: ConstraintType.DateRange }>;
            if (c.key && c.min && c.max) {
              const value = new Date(data[c.key]);
              const min = new Date(c.min);
              const max = new Date(c.max);
              if (value < min || value > max) {
                errors.push(c.message || `Date ${String(c.key)} out of range.`);
              }
            }
            break;
          }
          case ConstraintType.Dependency: {
            const c = constraint as Extract<ConstraintObj<T>, { type: ConstraintType.Dependency }>;
            if (
              data[c.key] === c.value &&
              (data[c.required] === undefined ||
                data[c.required] === null ||
                data[c.required] === '')
            ) {
              errors.push(
                c.message ||
                  `Field ${String(c.required)} is required when ${String(c.key)} is ${c.value}.`
              );
            }
            break;
          }
          case ConstraintType.Relation: {
            const c = constraint as Extract<ConstraintObj<T>, { type: ConstraintType.Relation }>;
            if (c.rule) {
              const result = c.rule(data, children);
              if (typeof result === 'string' && result) errors.push(c.message || result);
            }
            break;
          }
          // beforeCheckOut handled ailleurs
        }
      }
    }
    if (errors.length) {
      addErrors(id, errors);
      emitToDevTools('validate-check-in', id, errors);
      return false;
    }
    emitToDevTools('validate-check-in', id, []);
    return true;
  }

  let deskInstance: any = null;

  return {
    name: 'constraints',
    version: '1.0.0',

    install: (desk: any) => {
      deskInstance = desk;
      return () => {
        constraintErrors.value = [];
        deskInstance = null;
      };
    },

    onBeforeCheckIn: async (id: string | number, data: T): Promise<boolean> => {
      const children = deskInstance?.getAll ? deskInstance.getAll() : [];
      return await validateData(
        id,
        data,
        children.map((c: any) => c.data)
      );
    },

    onBeforeCheckOut: (id: string | number): boolean => {
      const children = deskInstance?.getAll ? deskInstance.getAll() : [];
      const item = children.find((c: any) => c.id === id)?.data;
      const errors: string[] = [];
      for (const constraint of constraints) {
        if (typeof constraint !== 'function' && constraint.type === ConstraintType.BeforeCheckOut) {
          if (constraint.rule) {
            const result = constraint.rule(
              item,
              children.map((c: any) => c.data)
            );
            if (typeof result === 'string' && result) {
              errors.push(constraint.message || result);
            }
          }
        }
      }
      removeErrorsForId(id);
      if (errors.length) {
        addErrors(id, errors);
        emitToDevTools('validate-check-out', id, errors);
        return false;
      }
      emitToDevTools('validate-check-out', id, []);
      return true;
    },

    methods: {
      getConstraintErrors: () => constraintErrors.value,
      getConstraintErrorsById: (_desk: any, id: string | number) =>
        constraintErrors.value.find((e) => e.id === id)?.errors ?? [],
      clearConstraintErrors: () => {
        constraintErrors.value = [];
      },
    },

    computed: {
      constraintErrorCount: () => constraintErrors.value.length,
      hasConstraintErrors: () => constraintErrors.value.length > 0,
    },
  };
}

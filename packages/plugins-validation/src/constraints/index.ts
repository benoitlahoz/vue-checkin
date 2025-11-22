import { ref } from 'vue';
import type { CheckInPlugin } from 'vue-airport';
import { requiredHandler } from './handlers/required';
import { minLengthHandler } from './handlers/minLength';
import { maxLengthHandler } from './handlers/maxLength';
import { enumHandler } from './handlers/enum';
import { patternHandler } from './handlers/pattern';
import { uniqueHandler } from './handlers/unique';
import { maxCountHandler } from './handlers/maxCount';
import { customHandler } from './handlers/custom';
import { rangeHandler } from './handlers/range';
import { immutableHandler } from './handlers/immutable';
import { forbiddenHandler } from './handlers/forbidden';
import { compareHandler } from './handlers/compare';
import { conditionalRequiredHandler } from './handlers/conditionalRequired';
import { formatHandler } from './handlers/format';
import { minValueHandler } from './handlers/minValue';
import { maxValueHandler } from './handlers/maxValue';
import { uniqueInScopeHandler } from './handlers/uniqueInScope';
import { existsHandler } from './handlers/exists';
import { relationHandler } from './handlers/relation';
import { beforeCheckOutHandler } from './handlers/beforeCheckOut';
import { relationCountHandler } from './handlers/relationCount';
import { uniqueGroupHandler } from './handlers/uniqueGroup';
import { dateRangeHandler } from './handlers/dateRange';
import { dependencyHandler } from './handlers/dependency';

/**
 * ConstraintType enumerates all supported constraint types for desk validation.
 * Each type enforces a specific business rule or data integrity check.
 */
export enum ConstraintType {
  Custom = 'custom',
  Range = 'range',
  Immutable = 'immutable',
  Forbidden = 'forbidden',
  Compare = 'compare',
  ConditionalRequired = 'conditionalRequired',
  Format = 'format',
  MinValue = 'minValue',
  MaxValue = 'maxValue',
  UniqueInScope = 'uniqueInScope',
  Exists = 'exists',
  Unique = 'unique',
  MaxCount = 'maxCount',
  Relation = 'relation',
  BeforeCheckOut = 'beforeCheckOut',
  Required = 'required',
  Pattern = 'pattern',
  MinLength = 'minLength',
  MaxLength = 'maxLength',
  Enum = 'enum',
  RelationCount = 'relationCount',
  UniqueGroup = 'uniqueGroup',
  DateRange = 'dateRange',
  Dependency = 'dependency',
}

export interface ConstraintError {
  id: string | number;
  errors: string[];
  timestamp: number;
}

export type ConstraintFn<T = any> = (child: T, children: T[]) => string | null;

export type ConstraintHandler<T = any> = (
  constraint: ConstraintObj<T>,
  data: T,
  children: T[],
  deskInstance?: any
) => string | null | Promise<string | null>;

const noopHandler: ConstraintHandler = async () => null;

const handlers: Record<ConstraintType, ConstraintHandler> = {
  [ConstraintType.Required]: requiredHandler,
  [ConstraintType.Forbidden]: forbiddenHandler,
  [ConstraintType.Unique]: uniqueHandler,
  [ConstraintType.MaxCount]: maxCountHandler,
  [ConstraintType.Pattern]: patternHandler,
  [ConstraintType.Custom]: customHandler,
  [ConstraintType.Range]: rangeHandler,
  [ConstraintType.BeforeCheckOut]: beforeCheckOutHandler,
  [ConstraintType.Immutable]: immutableHandler,
  [ConstraintType.Compare]: compareHandler,
  [ConstraintType.ConditionalRequired]: conditionalRequiredHandler,
  [ConstraintType.Format]: formatHandler,
  [ConstraintType.MinValue]: minValueHandler,
  [ConstraintType.MaxValue]: maxValueHandler,
  [ConstraintType.UniqueInScope]: uniqueInScopeHandler,
  [ConstraintType.Exists]: existsHandler,
  [ConstraintType.Relation]: relationHandler,
  [ConstraintType.RelationCount]: relationCountHandler,
  [ConstraintType.UniqueGroup]: uniqueGroupHandler,
  [ConstraintType.DateRange]: dateRangeHandler,
  [ConstraintType.Dependency]: dependencyHandler,
  [ConstraintType.Enum]: enumHandler,
  [ConstraintType.MinLength]: minLengthHandler,
  [ConstraintType.MaxLength]: maxLengthHandler,
};

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
      min: string | number | Date;
      max: string | number | Date;
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

export type Constraint<T = any> = ConstraintObj<T>;

export interface ConstraintError {
  id: string | number;
  errors: string[];
  timestamp: number;
}

export function createConstraintsPlugin<T extends Record<string, any> = any>(
  constraints: Constraint<T>[]
): CheckInPlugin<T> {
  const constraintErrors = ref<ConstraintError[]>([]);

  let deskInstance: any = null;

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
          hasErrors: errors.length > 0,
          errors,
        },
      });
    }
  };

  async function validateData(id: string | number, data: T, children: T[]): Promise<boolean> {
    const errors: string[] = [];
    for (const constraint of constraints) {
      // Ne pas appliquer BeforeCheckOut lors du check-in
      if ('type' in constraint && constraint.type === ConstraintType.BeforeCheckOut) continue;
      const handler = handlers[constraint.type];
      if (handler) {
        const err = await handler(constraint, data, children, deskInstance);
        if (err) errors.push(err);
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
      const beforeCheckOutConstraints = constraints.filter(
        (c) => c.type === ConstraintType.BeforeCheckOut
      );
      for (const constraint of beforeCheckOutConstraints) {
        if (constraint.type === ConstraintType.BeforeCheckOut) {
          const err = beforeCheckOutHandler(
            constraint,
            item,
            children.map((c: any) => c.data)
          );
          if (err instanceof Promise) {
            err.then((res) => {
              if (res) errors.push(res);
            });
          } else if (err) {
            errors.push(err);
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

import type { ObjectNodeData, ObjectNodeType } from '../types';
import { both } from 'vue-airport';

/**
 * Type Guards - Pure predicates for type checking
 */

export const isNull = (value: any): value is null => value === null;

export const isArray = (value: any): value is any[] => Array.isArray(value);

export const isDate = (value: any): value is Date => value instanceof Date;

const isObjectType = (value: any): boolean => typeof value === 'object';
const isNotSpecialObject = (value: any): boolean =>
  !isNull(value) && !isArray(value) && !isDate(value);

export const isObject = both(isObjectType, isNotSpecialObject) as (
  value: any
) => value is Record<string, any>;

export const isPrimitive = (type: ObjectNodeType): boolean =>
  [
    'string',
    'number',
    'boolean',
    'bigint',
    'symbol',
    'undefined',
    'null',
    'date',
    'function',
  ].includes(type);

export const isStructuralResult = (result: any): boolean =>
  Boolean(result && typeof result === 'object' && result.__structuralChange === true);

/**
 * Type Mapping - Pure function for type detection
 */

const typeMap: Record<string, ObjectNodeType> = {
  string: 'string',
  number: 'number',
  bigint: 'bigint',
  boolean: 'boolean',
  symbol: 'symbol',
  undefined: 'undefined',
  function: 'function',
};

export const typeOfToNodeType = (typeOf: string): ObjectNodeType => typeMap[typeOf] || 'unknown';

export const getTypeFromValue = (value: any): ObjectNodeType => {
  if (isNull(value)) return 'null';
  if (isArray(value)) return 'array';
  if (isDate(value)) return 'date';
  if (isObject(value)) return 'object';
  return typeOfToNodeType(typeof value);
};

/**
 * Node Type Detection - Apply transforms until structural change
 */

export const applyTransformsUntilStructural = (node: ObjectNodeData): any =>
  node.transforms.reduce((value, transform) => {
    const result = transform.fn(value, ...(transform.params || []));
    return isStructuralResult(result) ? value : result;
  }, node.value);

export const getNodeType = (node: ObjectNodeData): ObjectNodeType => {
  const transformedValue = applyTransformsUntilStructural(node);
  return getTypeFromValue(transformedValue);
};

export const getComputedValueType = (_node: ObjectNodeData, value: any): ObjectNodeType =>
  getTypeFromValue(value);

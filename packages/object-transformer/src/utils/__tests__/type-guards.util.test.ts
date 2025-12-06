import { describe, it, expect } from 'vitest';
import {
  isNull,
  isArray,
  isDate,
  isObject,
  typeOfToNodeType,
  getTypeFromValue,
  isStructuralResult,
} from '../type-guards.util';

describe('type-guards.util', () => {
  describe('isNull', () => {
    it('should return true for null', () => {
      expect(isNull(null)).toBe(true);
    });

    it('should return false for undefined', () => {
      expect(isNull(undefined)).toBe(false);
    });

    it('should return false for other values', () => {
      expect(isNull(0)).toBe(false);
      expect(isNull('')).toBe(false);
      expect(isNull(false)).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
    });

    it('should return false for non-arrays', () => {
      expect(isArray(null)).toBe(false);
      expect(isArray({})).toBe(false);
      expect(isArray('array')).toBe(false);
    });
  });

  describe('isDate', () => {
    it('should return true for Date objects', () => {
      expect(isDate(new Date())).toBe(true);
    });

    it('should return false for non-Date objects', () => {
      expect(isDate('2023-01-01')).toBe(false);
      expect(isDate(1234567890)).toBe(false);
      expect(isDate(null)).toBe(false);
    });
  });

  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
    });

    it('should return false for arrays', () => {
      expect(isObject([])).toBe(false);
    });

    it('should return false for null', () => {
      expect(isObject(null)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(true)).toBe(false);
    });
  });

  describe('typeOfToNodeType', () => {
    it('should map typeof results to NodeType', () => {
      expect(typeOfToNodeType('string')).toBe('string');
      expect(typeOfToNodeType('number')).toBe('number');
      expect(typeOfToNodeType('boolean')).toBe('boolean');
      expect(typeOfToNodeType('undefined')).toBe('undefined');
      expect(typeOfToNodeType('function')).toBe('function');
      expect(typeOfToNodeType('symbol')).toBe('symbol');
      expect(typeOfToNodeType('bigint')).toBe('bigint');
    });

    it('should return unknown for invalid types', () => {
      expect(typeOfToNodeType('invalid' as any)).toBe('unknown');
    });
  });

  describe('getTypeFromValue', () => {
    it('should return correct type for null', () => {
      expect(getTypeFromValue(null)).toBe('null');
    });

    it('should return correct type for Date', () => {
      expect(getTypeFromValue(new Date())).toBe('date');
    });

    it('should return correct type for array', () => {
      expect(getTypeFromValue([])).toBe('array');
    });

    it('should return correct type for object', () => {
      expect(getTypeFromValue({})).toBe('object');
    });

    it('should return correct type for primitives', () => {
      expect(getTypeFromValue('test')).toBe('string');
      expect(getTypeFromValue(123)).toBe('number');
      expect(getTypeFromValue(true)).toBe('boolean');
    });
  });

  describe('isStructuralResult', () => {
    it('should return true for structural change objects', () => {
      const result = {
        __structuralChange: true,
        action: 'split',
        parts: ['a', 'b'],
      };
      expect(isStructuralResult(result)).toBe(true);
    });

    it('should return false for non-structural results', () => {
      expect(isStructuralResult('string')).toBe(false);
      expect(isStructuralResult(123)).toBe(false);
      expect(isStructuralResult(null)).toBe(false);
      expect(isStructuralResult({})).toBe(false);
    });
  });
});

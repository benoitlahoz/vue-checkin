import { describe, it, expect } from 'vitest';

// Test the transform logic directly without mounting Vue components
const objectTransforms = {
  'Pick Keys': {
    fn: (v: any, keys: string) => {
      if (typeof v !== 'object' || v === null) return v;
      const k = typeof keys === 'string' ? keys.split(',').map((s) => s.trim()) : [];
      if (k.length === 0) return v;
      return k.reduce((acc: any, key) => {
        if (key in v) acc[key] = v[key];
        return acc;
      }, {});
    },
  },
  'Omit Keys': {
    fn: (v: any, keys: string) => {
      if (typeof v !== 'object' || v === null) return v;
      const k = typeof keys === 'string' ? keys.split(',').map((s) => s.trim()) : [];
      const res: any = { ...v };
      k.forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete res[key];
      });
      return res;
    },
  },
  'To String': {
    fn: (v: any) => {
      // Safety check: only stringify objects
      if (typeof v !== 'object' || v === null || Array.isArray(v)) {
        return String(v); // Fallback to standard String conversion
      }
      try {
        return JSON.stringify(v);
      } catch {
        return String(v);
      }
    },
  },
};

describe('TransformObject', () => {
  describe('Pick Keys', () => {
    it('should pick specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      expect(objectTransforms['Pick Keys'].fn(obj, 'a,c')).toEqual({ a: 1, c: 3 });
    });

    it('should handle keys with spaces', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(objectTransforms['Pick Keys'].fn(obj, 'a, b, c')).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should ignore non-existent keys', () => {
      const obj = { a: 1, b: 2 };
      expect(objectTransforms['Pick Keys'].fn(obj, 'a,z')).toEqual({ a: 1 });
    });

    it('should return empty object if no keys specified', () => {
      const obj = { a: 1, b: 2 };
      expect(objectTransforms['Pick Keys'].fn(obj, '')).toEqual({});
    });

    it('should return non-object values unchanged', () => {
      expect(objectTransforms['Pick Keys'].fn('string', 'a,b')).toBe('string');
      expect(objectTransforms['Pick Keys'].fn(null, 'a,b')).toBe(null);
    });
  });

  describe('Omit Keys', () => {
    it('should omit specified keys from object', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      expect(objectTransforms['Omit Keys'].fn(obj, 'b,d')).toEqual({ a: 1, c: 3 });
    });

    it('should handle keys with spaces', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(objectTransforms['Omit Keys'].fn(obj, 'b, c')).toEqual({ a: 1 });
    });

    it('should ignore non-existent keys', () => {
      const obj = { a: 1, b: 2 };
      expect(objectTransforms['Omit Keys'].fn(obj, 'z,y')).toEqual({ a: 1, b: 2 });
    });

    it('should return object unchanged if no keys specified', () => {
      const obj = { a: 1, b: 2 };
      expect(objectTransforms['Omit Keys'].fn(obj, '')).toEqual({ a: 1, b: 2 });
    });

    it('should return non-object values unchanged', () => {
      expect(objectTransforms['Omit Keys'].fn('string', 'a,b')).toBe('string');
      expect(objectTransforms['Omit Keys'].fn(null, 'a,b')).toBe(null);
    });
  });

  describe('To String', () => {
    it('should convert object to JSON string', () => {
      const obj = { a: 1, b: 2 };
      expect(objectTransforms['To String'].fn(obj)).toBe('{"a":1,"b":2}');
    });

    it('should handle nested objects', () => {
      const obj = { a: { b: 1 }, c: 2 };
      expect(objectTransforms['To String'].fn(obj)).toBe('{"a":{"b":1},"c":2}');
    });

    it('should convert null to string "null"', () => {
      expect(objectTransforms['To String'].fn(null)).toBe('null');
    });

    it('should convert arrays to string', () => {
      expect(objectTransforms['To String'].fn([1, 2, 3])).toBe('1,2,3');
    });

    it('should handle non-object values', () => {
      expect(objectTransforms['To String'].fn('text')).toBe('text');
      expect(objectTransforms['To String'].fn(123)).toBe('123');
    });
  });
});

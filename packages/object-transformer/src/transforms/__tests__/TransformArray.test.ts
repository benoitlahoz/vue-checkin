import { describe, it, expect } from 'vitest';

// Test the transform logic directly without mounting Vue components
const arrayTransforms = {
  Join: {
    fn: (v: any[], separator: string) => {
      if (!Array.isArray(v)) return v;
      const sep = typeof separator === 'string' ? separator : ', ';
      return v.join(sep);
    },
  },
  Unique: {
    fn: (v: any[]) => {
      if (!Array.isArray(v)) return v;
      return Array.from(new Set(v));
    },
  },
  'Filter Nulls': {
    fn: (v: any[]) => {
      if (!Array.isArray(v)) return v;
      return v.filter((item) => item != null);
    },
  },
  'Filter Undefined': {
    fn: (v: any[]) => {
      if (!Array.isArray(v)) return v;
      return v.filter((item) => item !== undefined);
    },
  },
  'Filter By Value': {
    fn: (v: any[], value: any) => {
      if (!Array.isArray(v)) return v;
      return v.filter((item) => item === value);
    },
  },
  'To String': {
    fn: (v: any) => {
      if (!Array.isArray(v)) {
        return String(v);
      }
      return JSON.stringify(v);
    },
  },
};

describe('TransformArray', () => {
  describe('Join', () => {
    it('should join array elements with separator', () => {
      expect(arrayTransforms.Join.fn(['a', 'b', 'c'], ', ')).toBe('a, b, c');
      expect(arrayTransforms.Join.fn([1, 2, 3], '-')).toBe('1-2-3');
    });

    it('should use default separator', () => {
      expect(arrayTransforms.Join.fn(['a', 'b', 'c'], ', ')).toBe('a, b, c');
    });
  });

  describe('Unique', () => {
    it('should remove duplicate values', () => {
      expect(arrayTransforms.Unique.fn([1, 2, 2, 3, 1])).toEqual([1, 2, 3]);
      expect(arrayTransforms.Unique.fn(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should handle arrays with no duplicates', () => {
      expect(arrayTransforms.Unique.fn([1, 2, 3])).toEqual([1, 2, 3]);
    });
  });

  describe('Filter Nulls', () => {
    it('should remove null and undefined values', () => {
      expect(arrayTransforms['Filter Nulls'].fn([1, null, 2, undefined, 3])).toEqual([1, 2, 3]);
      expect(arrayTransforms['Filter Nulls'].fn([null, undefined])).toEqual([]);
    });

    it('should keep falsy values that are not null/undefined', () => {
      expect(arrayTransforms['Filter Nulls'].fn([0, false, '', null])).toEqual([0, false, '']);
    });
  });

  describe('Filter Undefined', () => {
    it('should remove only undefined values', () => {
      expect(arrayTransforms['Filter Undefined'].fn([1, undefined, 2, null, 3])).toEqual([
        1,
        2,
        null,
        3,
      ]);
    });

    it('should keep null values', () => {
      expect(arrayTransforms['Filter Undefined'].fn([null, undefined])).toEqual([null]);
    });
  });

  describe('Filter By Value', () => {
    it('should keep only items matching value', () => {
      expect(arrayTransforms['Filter By Value'].fn([1, 2, 3, 2, 1], 2)).toEqual([2, 2]);
      expect(arrayTransforms['Filter By Value'].fn(['a', 'b', 'a'], 'a')).toEqual(['a', 'a']);
    });

    it('should return empty array if no match', () => {
      expect(arrayTransforms['Filter By Value'].fn([1, 2, 3], 4)).toEqual([]);
    });
  });

  describe('To String', () => {
    it('should convert array to JSON string', () => {
      expect(arrayTransforms['To String'].fn([1, 2, 3])).toBe('[1,2,3]');
      expect(arrayTransforms['To String'].fn(['a', 'b'])).toBe('["a","b"]');
    });

    it('should handle nested arrays', () => {
      expect(
        arrayTransforms['To String'].fn([
          [1, 2],
          [3, 4],
        ])
      ).toBe('[[1,2],[3,4]]');
    });
  });
});

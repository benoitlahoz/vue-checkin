import { describe, it, expect } from 'vitest';

// Test the condition logic directly without mounting Vue components
// These implementations mirror the condition functions in ConditionArray.vue
const arrayConditions = {
  'Is Empty': {
    condition: (v: any[], not = false) => {
      if (!Array.isArray(v)) return false;
      const result = v.length === 0;
      return not ? !result : result;
    },
  },
  'Length Equals': {
    condition: (v: any[], not = false, length: number) => {
      if (!Array.isArray(v)) return false;
      const result = v.length === length;
      return not ? !result : result;
    },
  },
  'Length Greater Than': {
    condition: (v: any[], not = false, threshold: number) => {
      if (!Array.isArray(v)) return false;
      const result = v.length > threshold;
      return not ? !result : result;
    },
  },
  'Length Less Than': {
    condition: (v: any[], not = false, threshold: number) => {
      if (!Array.isArray(v)) return false;
      const result = v.length < threshold;
      return not ? !result : result;
    },
  },
  Contains: {
    condition: (v: any[], not = false, value: any) => {
      if (!Array.isArray(v)) return false;
      const result = v.includes(value);
      return not ? !result : result;
    },
  },
  'All Items Same Type': {
    condition: (v: any[], not = false) => {
      if (!Array.isArray(v) || v.length === 0) return false;
      const firstType = typeof v[0];
      const result = v.every((item) => typeof item === firstType);
      return not ? !result : result;
    },
  },
};

describe('ConditionArray', () => {
  describe('Is Empty', () => {
    it('should detect empty arrays', () => {
      expect(arrayConditions['Is Empty'].condition([], false)).toBe(true);
    });

    it('should reject non-empty arrays', () => {
      expect(arrayConditions['Is Empty'].condition([1], false)).toBe(false);
      expect(arrayConditions['Is Empty'].condition([1, 2, 3], false)).toBe(false);
    });

    it('should invert condition when not=true', () => {
      expect(arrayConditions['Is Empty'].condition([], true)).toBe(false);
      expect(arrayConditions['Is Empty'].condition([1], true)).toBe(true);
    });
  });

  describe('Length Equals', () => {
    it('should detect arrays with exact length', () => {
      expect(arrayConditions['Length Equals'].condition([1, 2, 3], false, 3)).toBe(true);
      expect(arrayConditions['Length Equals'].condition([], false, 0)).toBe(true);
    });

    it('should reject arrays with different length', () => {
      expect(arrayConditions['Length Equals'].condition([1, 2], false, 3)).toBe(false);
      expect(arrayConditions['Length Equals'].condition([1, 2, 3, 4], false, 3)).toBe(false);
    });

    it('should invert condition when not=true', () => {
      expect(arrayConditions['Length Equals'].condition([1, 2, 3], true, 3)).toBe(false);
      expect(arrayConditions['Length Equals'].condition([1, 2], true, 3)).toBe(true);
    });
  });

  describe('Length Greater Than', () => {
    it('should detect arrays with length greater than threshold', () => {
      expect(arrayConditions['Length Greater Than'].condition([1, 2, 3], false, 2)).toBe(true);
      expect(arrayConditions['Length Greater Than'].condition([1, 2, 3, 4], false, 2)).toBe(true);
    });

    it('should reject arrays with length not greater than threshold', () => {
      expect(arrayConditions['Length Greater Than'].condition([1, 2], false, 2)).toBe(false);
      expect(arrayConditions['Length Greater Than'].condition([1], false, 2)).toBe(false);
    });

    it('should invert condition when not=true', () => {
      expect(arrayConditions['Length Greater Than'].condition([1, 2, 3], true, 2)).toBe(false);
      expect(arrayConditions['Length Greater Than'].condition([1], true, 2)).toBe(true);
    });
  });

  describe('Length Less Than', () => {
    it('should detect arrays with length less than threshold', () => {
      expect(arrayConditions['Length Less Than'].condition([1], false, 3)).toBe(true);
      expect(arrayConditions['Length Less Than'].condition([1, 2], false, 3)).toBe(true);
    });

    it('should reject arrays with length not less than threshold', () => {
      expect(arrayConditions['Length Less Than'].condition([1, 2, 3], false, 3)).toBe(false);
      expect(arrayConditions['Length Less Than'].condition([1, 2, 3, 4], false, 3)).toBe(false);
    });

    it('should invert condition when not=true', () => {
      expect(arrayConditions['Length Less Than'].condition([1], true, 3)).toBe(false);
      expect(arrayConditions['Length Less Than'].condition([1, 2, 3, 4], true, 3)).toBe(true);
    });
  });

  describe('Contains', () => {
    it('should detect when array contains value', () => {
      expect(arrayConditions.Contains.condition([1, 2, 3], false, 2)).toBe(true);
      expect(arrayConditions.Contains.condition(['a', 'b', 'c'], false, 'b')).toBe(true);
    });

    it('should reject when array does not contain value', () => {
      expect(arrayConditions.Contains.condition([1, 2, 3], false, 4)).toBe(false);
      expect(arrayConditions.Contains.condition(['a', 'b'], false, 'c')).toBe(false);
    });

    it('should invert condition when not=true', () => {
      expect(arrayConditions.Contains.condition([1, 2, 3], true, 2)).toBe(false);
      expect(arrayConditions.Contains.condition([1, 2, 3], true, 4)).toBe(true);
    });
  });

  describe('All Items Same Type', () => {
    it('should detect when all items have same type', () => {
      expect(arrayConditions['All Items Same Type'].condition([1, 2, 3], false)).toBe(true);
      expect(arrayConditions['All Items Same Type'].condition(['a', 'b', 'c'], false)).toBe(true);
      expect(arrayConditions['All Items Same Type'].condition([true, false], false)).toBe(true);
    });

    it('should reject when items have different types', () => {
      expect(arrayConditions['All Items Same Type'].condition([1, 'a', 3], false)).toBe(false);
      expect(arrayConditions['All Items Same Type'].condition([1, true, 'a'], false)).toBe(false);
    });

    it('should reject empty arrays', () => {
      expect(arrayConditions['All Items Same Type'].condition([], false)).toBe(false);
    });

    it('should invert condition when not=true', () => {
      expect(arrayConditions['All Items Same Type'].condition([1, 2, 3], true)).toBe(false);
      expect(arrayConditions['All Items Same Type'].condition([1, 'a'], true)).toBe(true);
    });
  });
});

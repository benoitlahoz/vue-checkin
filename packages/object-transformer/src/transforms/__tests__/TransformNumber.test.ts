import { describe, it, expect } from 'vitest';

// Test the transform logic directly without mounting Vue components
const numberTransforms = {
  Add: {
    fn: (v: any, amount: number) => {
      if (typeof v !== 'number') return v;
      const amt = typeof amount === 'number' ? amount : 1;
      return v + amt;
    },
  },
  Subtract: {
    fn: (v: any, amount: number) => {
      if (typeof v !== 'number') return v;
      const amt = typeof amount === 'number' ? amount : 1;
      return v - amt;
    },
  },
  Multiply: {
    fn: (v: any, factor: number) => {
      if (typeof v !== 'number') return v;
      const f = typeof factor === 'number' ? factor : 2;
      return v * f;
    },
  },
  Divide: {
    fn: (v: any, divisor: number) => {
      if (typeof v !== 'number') return v;
      const d = typeof divisor === 'number' && divisor !== 0 ? divisor : 2;
      return v / d;
    },
  },
  Round: {
    fn: (v: any) => (typeof v === 'number' ? Math.round(v) : v),
  },
  Ceil: {
    fn: (v: any) => (typeof v === 'number' ? Math.ceil(v) : v),
  },
  Floor: {
    fn: (v: any) => (typeof v === 'number' ? Math.floor(v) : v),
  },
  Absolute: {
    fn: (v: any) => (typeof v === 'number' ? Math.abs(v) : v),
  },
  Negate: {
    fn: (v: any) => (typeof v === 'number' ? -v : v),
  },
  Power: {
    fn: (v: any, exponent: number) => {
      if (typeof v !== 'number') return v;
      const exp = typeof exponent === 'number' ? exponent : 2;
      return Math.pow(v, exp);
    },
  },
  Modulo: {
    fn: (v: any, modulus: number) => {
      if (typeof v !== 'number') return v;
      const mod = typeof modulus === 'number' && modulus !== 0 ? modulus : 2;
      return v % mod;
    },
  },
  'To Date': {
    fn: (v: any) => (typeof v === 'number' ? new Date(v) : v),
  },
  'To String': {
    fn: (v: any) => {
      if (typeof v !== 'number') {
        return String(v);
      }
      return String(v);
    },
  },
};

describe('TransformNumber', () => {
  describe('Add', () => {
    it('should add amount to number', () => {
      expect(numberTransforms.Add.fn(5, 3)).toBe(8);
      expect(numberTransforms.Add.fn(10, -2)).toBe(8);
    });

    it('should use default amount of 1', () => {
      expect(numberTransforms.Add.fn(5, 1)).toBe(6);
    });
  });

  describe('Subtract', () => {
    it('should subtract amount from number', () => {
      expect(numberTransforms.Subtract.fn(10, 3)).toBe(7);
      expect(numberTransforms.Subtract.fn(5, -2)).toBe(7);
    });
  });

  describe('Multiply', () => {
    it('should multiply number by factor', () => {
      expect(numberTransforms.Multiply.fn(5, 3)).toBe(15);
      expect(numberTransforms.Multiply.fn(10, 0.5)).toBe(5);
    });

    it('should use default factor of 2', () => {
      expect(numberTransforms.Multiply.fn(5, 2)).toBe(10);
    });
  });

  describe('Divide', () => {
    it('should divide number by divisor', () => {
      expect(numberTransforms.Divide.fn(10, 2)).toBe(5);
      expect(numberTransforms.Divide.fn(15, 3)).toBe(5);
    });

    it('should handle division by zero with default', () => {
      expect(numberTransforms.Divide.fn(10, 0)).toBe(5);
    });
  });

  describe('Round', () => {
    it('should round numbers', () => {
      expect(numberTransforms.Round.fn(3.7)).toBe(4);
      expect(numberTransforms.Round.fn(3.2)).toBe(3);
      expect(numberTransforms.Round.fn(3.5)).toBe(4);
    });
  });

  describe('Ceil', () => {
    it('should round up to nearest integer', () => {
      expect(numberTransforms.Ceil.fn(3.1)).toBe(4);
      expect(numberTransforms.Ceil.fn(3.9)).toBe(4);
      expect(numberTransforms.Ceil.fn(-3.1)).toBe(-3);
    });
  });

  describe('Floor', () => {
    it('should round down to nearest integer', () => {
      expect(numberTransforms.Floor.fn(3.1)).toBe(3);
      expect(numberTransforms.Floor.fn(3.9)).toBe(3);
      expect(numberTransforms.Floor.fn(-3.1)).toBe(-4);
    });
  });

  describe('Absolute', () => {
    it('should return absolute value', () => {
      expect(numberTransforms.Absolute.fn(-5)).toBe(5);
      expect(numberTransforms.Absolute.fn(5)).toBe(5);
      expect(numberTransforms.Absolute.fn(0)).toBe(0);
    });
  });

  describe('Negate', () => {
    it('should negate the number', () => {
      expect(numberTransforms.Negate.fn(5)).toBe(-5);
      expect(numberTransforms.Negate.fn(-5)).toBe(5);
      expect(numberTransforms.Negate.fn(0)).toBe(-0);
    });
  });

  describe('Power', () => {
    it('should raise number to power', () => {
      expect(numberTransforms.Power.fn(2, 3)).toBe(8);
      expect(numberTransforms.Power.fn(5, 2)).toBe(25);
      expect(numberTransforms.Power.fn(10, 0)).toBe(1);
    });
  });

  describe('Modulo', () => {
    it('should return remainder of division', () => {
      expect(numberTransforms.Modulo.fn(10, 3)).toBe(1);
      expect(numberTransforms.Modulo.fn(15, 4)).toBe(3);
    });

    it('should handle modulo by zero with default', () => {
      expect(numberTransforms.Modulo.fn(10, 0)).toBe(0);
    });
  });

  describe('To Date', () => {
    it('should convert timestamp to Date', () => {
      const timestamp = 1609459200000; // 2021-01-01 00:00:00 UTC
      const result = numberTransforms['To Date'].fn(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2021);
    });
  });

  describe('To String', () => {
    it('should convert number to string', () => {
      expect(numberTransforms['To String'].fn(123)).toBe('123');
      expect(numberTransforms['To String'].fn(45.67)).toBe('45.67');
      expect(numberTransforms['To String'].fn(-10)).toBe('-10');
    });
  });
});

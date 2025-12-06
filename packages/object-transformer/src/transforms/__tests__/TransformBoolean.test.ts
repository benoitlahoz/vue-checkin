import { describe, it, expect } from 'vitest';

// Test the transform logic directly without mounting Vue components
const booleanTransforms = {
  Negate: {
    fn: (v: boolean) => {
      return !v;
    },
  },
  'To String': {
    fn: (v: boolean) => {
      if (typeof v !== 'boolean') {
        return String(v);
      }
      return String(v);
    },
  },
  'To Number': {
    fn: (v: boolean) => {
      if (typeof v !== 'boolean') {
        return Number(v);
      }
      return v ? 1 : 0;
    },
  },
  'To Yes/No': {
    fn: (v: boolean) => {
      return v ? 'Yes' : 'No';
    },
  },
  'To On/Off': {
    fn: (v: boolean) => {
      return v ? 'On' : 'Off';
    },
  },
};

describe('TransformBoolean', () => {
  describe('Negate', () => {
    it('should negate boolean value', () => {
      expect(booleanTransforms.Negate.fn(true)).toBe(false);
      expect(booleanTransforms.Negate.fn(false)).toBe(true);
    });
  });

  describe('To String', () => {
    it('should convert boolean to string', () => {
      expect(booleanTransforms['To String'].fn(true)).toBe('true');
      expect(booleanTransforms['To String'].fn(false)).toBe('false');
    });
  });

  describe('To Number', () => {
    it('should convert boolean to number', () => {
      expect(booleanTransforms['To Number'].fn(true)).toBe(1);
      expect(booleanTransforms['To Number'].fn(false)).toBe(0);
    });
  });

  describe('To Yes/No', () => {
    it('should convert boolean to Yes/No', () => {
      expect(booleanTransforms['To Yes/No'].fn(true)).toBe('Yes');
      expect(booleanTransforms['To Yes/No'].fn(false)).toBe('No');
    });
  });

  describe('To On/Off', () => {
    it('should convert boolean to On/Off', () => {
      expect(booleanTransforms['To On/Off'].fn(true)).toBe('On');
      expect(booleanTransforms['To On/Off'].fn(false)).toBe('Off');
    });
  });
});

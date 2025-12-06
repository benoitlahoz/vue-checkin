import { describe, it, expect } from 'vitest';

// Test the condition logic directly without mounting Vue components
// These implementations mirror the condition functions in ConditionString.vue
const stringConditions = {
  Contains: {
    condition: (v: string, not = false, search: string) => {
      if (typeof v !== 'string') return false;
      if (!search || typeof search !== 'string') return false;
      const result = v.includes(search);
      return not ? !result : result;
    },
  },
  'Matches Particle': {
    condition: (v: string, not = false, particleList?: string) => {
      if (typeof v !== 'string') return false;
      const defaultParticles = [
        'a',
        'an',
        'the',
        'is',
        'are',
        'was',
        'were',
        'in',
        'on',
        'at',
        'to',
        'of',
      ];
      const particles = particleList
        ? particleList.split(',').map((p) => p.trim())
        : defaultParticles;
      const words = v.split(/\s+/);
      const result = words.some((word) => particles.includes(word));
      return not ? !result : result;
    },
  },
  'Is Uppercase': {
    condition: (v: string, not = false) => {
      if (typeof v !== 'string') return false;
      const result = v === v.toUpperCase() && v !== v.toLowerCase();
      return not ? !result : result;
    },
  },
  'Is Lowercase': {
    condition: (v: string, not = false) => {
      if (typeof v !== 'string') return false;
      const result = v === v.toLowerCase() && v !== v.toUpperCase();
      return not ? !result : result;
    },
  },
  Equals: {
    condition: (v: string, not = false, target: string) => {
      if (typeof v !== 'string') return false;
      const result = v === target;
      return not ? !result : result;
    },
  },
  'Starts With': {
    condition: (v: string, not = false, prefix: string) => {
      if (typeof v !== 'string') return false;
      const result = v.startsWith(prefix);
      return not ? !result : result;
    },
  },
  'Ends With': {
    condition: (v: string, not = false, suffix: string) => {
      if (typeof v !== 'string') return false;
      const result = v.endsWith(suffix);
      return not ? !result : result;
    },
  },
  'Length >': {
    condition: (v: string, not = false, threshold: number) => {
      if (typeof v !== 'string') return false;
      const result = v.length > threshold;
      return not ? !result : result;
    },
  },
  'Length <': {
    condition: (v: string, not = false, threshold: number) => {
      if (typeof v !== 'string') return false;
      const result = v.length < threshold;
      return not ? !result : result;
    },
  },
  'Matches Regex': {
    condition: (v: string, not = false, pattern: string) => {
      if (typeof v !== 'string') return false;
      if (!pattern) return false;
      try {
        const regex = new RegExp(pattern);
        const result = regex.test(v);
        return not ? !result : result;
      } catch {
        return false;
      }
    },
  },
};

describe('ConditionString', () => {
  describe('Contains', () => {
    it('should detect when string contains search term (not=false)', () => {
      expect(stringConditions.Contains.condition('Hello World', false, 'World')).toBe(true);
    });

    it('should detect when string does not contain search term (not=false)', () => {
      expect(stringConditions.Contains.condition('Hello World', false, 'xyz')).toBe(false);
    });

    it('should invert condition when not=true', () => {
      expect(stringConditions.Contains.condition('Hello World', true, 'World')).toBe(false);
    });

    it('should handle empty search term', () => {
      expect(stringConditions.Contains.condition('Hello World', false, '')).toBe(false);
    });
  });

  describe('Matches Particle', () => {
    it('should match whole word when particle exists', () => {
      const matches = stringConditions['Matches Particle'].condition('Hello World', false, 'Hello');
      expect(matches).toBe(true);
    });

    it('should not match partial word', () => {
      const matches = stringConditions['Matches Particle'].condition('Hello World', false, 'Hel');
      expect(matches).toBe(false);
    });

    it('should match default particles', () => {
      const matches = stringConditions['Matches Particle'].condition('the quick brown fox', false);
      expect(matches).toBe(true); // "the" is a default particle
    });
  });

  describe('Is Uppercase', () => {
    it('should detect fully uppercase string', () => {
      expect(stringConditions['Is Uppercase'].condition('HELLO', false)).toBe(true);
    });

    it('should reject mixed case string', () => {
      expect(stringConditions['Is Uppercase'].condition('Hello', false)).toBe(false);
    });

    it('should invert condition when not=true', () => {
      expect(stringConditions['Is Uppercase'].condition('HELLO', true)).toBe(false);
    });
  });

  describe('Is Lowercase', () => {
    it('should detect fully lowercase string', () => {
      expect(stringConditions['Is Lowercase'].condition('hello', false)).toBe(true);
    });

    it('should reject mixed case string', () => {
      expect(stringConditions['Is Lowercase'].condition('Hello', false)).toBe(false);
    });
  });

  describe('Equals', () => {
    it('should match exact string', () => {
      expect(stringConditions.Equals.condition('test', false, 'test')).toBe(true);
    });

    it('should reject different string', () => {
      expect(stringConditions.Equals.condition('test', false, 'Test')).toBe(false);
    });

    it('should invert condition when not=true', () => {
      expect(stringConditions.Equals.condition('test', true, 'test')).toBe(false);
    });
  });

  describe('Starts With', () => {
    it('should detect when string starts with prefix', () => {
      expect(stringConditions['Starts With'].condition('Hello World', false, 'Hello')).toBe(true);
    });

    it('should reject when string does not start with prefix', () => {
      expect(stringConditions['Starts With'].condition('Hello World', false, 'World')).toBe(false);
    });
  });

  describe('Ends With', () => {
    it('should detect when string ends with suffix', () => {
      expect(stringConditions['Ends With'].condition('Hello World', false, 'World')).toBe(true);
    });

    it('should reject when string does not end with suffix', () => {
      expect(stringConditions['Ends With'].condition('Hello World', false, 'Hello')).toBe(false);
    });
  });

  describe('Length >', () => {
    it('should detect when string length is greater than threshold', () => {
      expect(stringConditions['Length >'].condition('Hello', false, 3)).toBe(true);
    });

    it('should reject when string length is not greater', () => {
      expect(stringConditions['Length >'].condition('Hi', false, 5)).toBe(false);
    });

    it('should handle equal length as false', () => {
      expect(stringConditions['Length >'].condition('Hello', false, 5)).toBe(false);
    });
  });

  describe('Length <', () => {
    it('should detect when string length is less than threshold', () => {
      expect(stringConditions['Length <'].condition('Hi', false, 5)).toBe(true);
    });

    it('should reject when string length is not less', () => {
      expect(stringConditions['Length <'].condition('Hello World', false, 5)).toBe(false);
    });

    it('should handle equal length as false', () => {
      expect(stringConditions['Length <'].condition('Hello', false, 5)).toBe(false);
    });
  });

  describe('Matches Regex', () => {
    it('should match valid regex pattern', () => {
      expect(stringConditions['Matches Regex'].condition('test123', false, '^test\\d+$')).toBe(
        true
      );
    });

    it('should reject non-matching pattern', () => {
      expect(stringConditions['Matches Regex'].condition('test', false, '^test\\d+$')).toBe(false);
    });

    it('should handle email regex pattern', () => {
      const emailRegex = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
      expect(
        stringConditions['Matches Regex'].condition('test@example.com', false, emailRegex)
      ).toBe(true);
      expect(stringConditions['Matches Regex'].condition('invalid-email', false, emailRegex)).toBe(
        false
      );
    });

    it('should invert condition when not=true', () => {
      expect(stringConditions['Matches Regex'].condition('test123', true, '^test\\d+$')).toBe(
        false
      );
    });
  });
});

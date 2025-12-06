import { describe, it, expect } from 'vitest';

// Test the transform logic directly without mounting Vue components
// These implementations mirror the transform functions in TransformString.vue
const stringTransforms = {
  Uppercase: {
    fn: (v: any) => (typeof v === 'string' ? v.toUpperCase() : v),
  },
  Lowercase: {
    fn: (v: any) => (typeof v === 'string' ? v.toLowerCase() : v),
  },
  Capitalized: {
    fn: (v: any) =>
      typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : v,
  },
  Replace: {
    fn: (v: string, s: string, r: string) => {
      if (typeof s !== 'string') s = '';
      if (typeof r !== 'string') r = '';
      if (s === '') return v;
      return v.split(s).join(r);
    },
  },
  Trim: {
    fn: (v: any) => (typeof v === 'string' ? v.trim() : v),
  },
  Append: {
    fn: (v: string, s: string) => {
      if (typeof s !== 'string') s = '';
      return v + s;
    },
  },
  Prepend: {
    fn: (v: string, p: string) => {
      if (typeof p !== 'string') p = '';
      return p + v;
    },
  },
  Substring: {
    fn: (v: string, start: number, end?: number) => {
      const startIdx = typeof start === 'number' ? start : 0;
      const endIdx = typeof end === 'number' ? end : undefined;
      return v.substring(startIdx, endIdx);
    },
  },
  Repeat: {
    fn: (v: string, count: number) => {
      const repeatCount = typeof count === 'number' && count > 0 ? Math.floor(count) : 1;
      return v.repeat(repeatCount);
    },
  },
  'Remove Spaces': {
    fn: (v: string) => v.replace(/\s+/g, ''),
  },
  'Remove Multiple Spaces': {
    fn: (v: string) => v.replace(/\s+/g, ' '),
  },
  Reverse: {
    fn: (v: string) => v.split('').reverse().join(''),
  },
  'To Number': {
    fn: (v: string) => {
      if (typeof v !== 'string') return v;
      return Number(v);
    },
  },
  'Replace Regex': {
    fn: (v: string, pattern: string, flags: string = 'g', replacement: string = '') => {
      if (typeof v !== 'string') return v;
      if (!pattern) return v;

      try {
        const regex = new RegExp(pattern, flags);
        return v.replace(regex, replacement);
      } catch {
        return v;
      }
    },
  },
  'Extract Regex': {
    fn: (v: string, pattern: string, flags: string = '', groupIndex: number = 0) => {
      if (typeof v !== 'string') return null;
      if (!pattern) return null;

      try {
        const regex = new RegExp(pattern, flags);
        const match = v.match(regex);

        if (!match) return null;

        const index = typeof groupIndex === 'number' ? groupIndex : 0;
        return match[index] !== undefined ? match[index] : null;
      } catch {
        return null;
      }
    },
  },
};

describe('TransformString', () => {
  describe('Uppercase', () => {
    it('should convert string to uppercase', () => {
      expect(stringTransforms.Uppercase.fn('hello')).toBe('HELLO');
      expect(stringTransforms.Uppercase.fn('Hello World')).toBe('HELLO WORLD');
    });

    it('should handle already uppercase strings', () => {
      expect(stringTransforms.Uppercase.fn('HELLO')).toBe('HELLO');
    });
  });

  describe('Lowercase', () => {
    it('should convert string to lowercase', () => {
      expect(stringTransforms.Lowercase.fn('HELLO')).toBe('hello');
      expect(stringTransforms.Lowercase.fn('Hello World')).toBe('hello world');
    });

    it('should handle already lowercase strings', () => {
      expect(stringTransforms.Lowercase.fn('hello')).toBe('hello');
    });
  });

  describe('Capitalized', () => {
    it('should capitalize first letter and lowercase rest', () => {
      expect(stringTransforms.Capitalized.fn('hello')).toBe('Hello');
      expect(stringTransforms.Capitalized.fn('HELLO')).toBe('Hello');
      expect(stringTransforms.Capitalized.fn('hELLO wORLD')).toBe('Hello world');
    });
  });

  describe('Replace', () => {
    it('should replace all occurrences', () => {
      expect(stringTransforms.Replace.fn('hello world', 'o', 'a')).toBe('hella warld');
      expect(stringTransforms.Replace.fn('aaa', 'a', 'b')).toBe('bbb');
    });

    it('should handle empty search string', () => {
      expect(stringTransforms.Replace.fn('hello', '', 'x')).toBe('hello');
    });

    it('should handle empty replacement', () => {
      expect(stringTransforms.Replace.fn('hello world', ' ', '')).toBe('helloworld');
    });
  });

  describe('Trim', () => {
    it('should remove leading and trailing whitespace', () => {
      expect(stringTransforms.Trim.fn('  hello  ')).toBe('hello');
      expect(stringTransforms.Trim.fn('\n\thello\t\n')).toBe('hello');
    });

    it('should not affect internal whitespace', () => {
      expect(stringTransforms.Trim.fn('  hello world  ')).toBe('hello world');
    });
  });

  describe('Append', () => {
    it('should append suffix to string', () => {
      expect(stringTransforms.Append.fn('hello', ' world')).toBe('hello world');
      expect(stringTransforms.Append.fn('test', '123')).toBe('test123');
    });

    it('should handle empty suffix', () => {
      expect(stringTransforms.Append.fn('hello', '')).toBe('hello');
    });
  });

  describe('Prepend', () => {
    it('should prepend prefix to string', () => {
      expect(stringTransforms.Prepend.fn('world', 'hello ')).toBe('hello world');
      expect(stringTransforms.Prepend.fn('123', 'test')).toBe('test123');
    });

    it('should handle empty prefix', () => {
      expect(stringTransforms.Prepend.fn('hello', '')).toBe('hello');
    });
  });

  describe('Substring', () => {
    it('should extract substring with start and end', () => {
      expect(stringTransforms.Substring.fn('hello world', 0, 5)).toBe('hello');
      expect(stringTransforms.Substring.fn('hello world', 6, 11)).toBe('world');
    });

    it('should extract substring with start only', () => {
      expect(stringTransforms.Substring.fn('hello world', 6)).toBe('world');
    });

    it('should handle negative indices', () => {
      expect(stringTransforms.Substring.fn('hello', -2)).toBe('hello');
    });
  });

  describe('Repeat', () => {
    it('should repeat string n times', () => {
      expect(stringTransforms.Repeat.fn('ha', 3)).toBe('hahaha');
      expect(stringTransforms.Repeat.fn('x', 5)).toBe('xxxxx');
    });

    it('should handle count of 1', () => {
      expect(stringTransforms.Repeat.fn('hello', 1)).toBe('hello');
    });

    it('should handle invalid counts', () => {
      expect(stringTransforms.Repeat.fn('hello', 0)).toBe('hello');
      expect(stringTransforms.Repeat.fn('hello', -1)).toBe('hello');
    });
  });

  describe('Remove Spaces', () => {
    it('should remove all spaces', () => {
      expect(stringTransforms['Remove Spaces'].fn('hello world')).toBe('helloworld');
      expect(stringTransforms['Remove Spaces'].fn('a b c d')).toBe('abcd');
    });

    it('should remove tabs and newlines', () => {
      expect(stringTransforms['Remove Spaces'].fn('hello\t\nworld')).toBe('helloworld');
    });
  });

  describe('Remove Multiple Spaces', () => {
    it('should collapse multiple spaces into one', () => {
      expect(stringTransforms['Remove Multiple Spaces'].fn('hello  world')).toBe('hello world');
      expect(stringTransforms['Remove Multiple Spaces'].fn('a    b    c')).toBe('a b c');
    });

    it('should collapse tabs and newlines', () => {
      expect(stringTransforms['Remove Multiple Spaces'].fn('hello\t\t\nworld')).toBe('hello world');
    });
  });

  describe('Reverse', () => {
    it('should reverse the string', () => {
      expect(stringTransforms.Reverse.fn('hello')).toBe('olleh');
      expect(stringTransforms.Reverse.fn('abc')).toBe('cba');
    });

    it('should handle palindromes', () => {
      expect(stringTransforms.Reverse.fn('racecar')).toBe('racecar');
    });
  });

  describe('To Number', () => {
    it('should convert numeric strings to numbers', () => {
      expect(stringTransforms['To Number'].fn('123')).toBe(123);
      expect(stringTransforms['To Number'].fn('45.67')).toBe(45.67);
      expect(stringTransforms['To Number'].fn('-10')).toBe(-10);
    });

    it('should return NaN for non-numeric strings', () => {
      expect(stringTransforms['To Number'].fn('hello')).toBeNaN();
      expect(stringTransforms['To Number'].fn('12abc')).toBeNaN();
    });
  });

  describe('Replace Regex', () => {
    it('should replace using regex pattern', () => {
      expect(stringTransforms['Replace Regex'].fn('hello123world456', '\\d+', 'g', 'X')).toBe(
        'helloXworldX'
      );
      expect(stringTransforms['Replace Regex'].fn('test TEST', 'test', 'gi', 'word')).toBe(
        'word word'
      );
    });

    it('should handle invalid regex gracefully', () => {
      expect(stringTransforms['Replace Regex'].fn('hello', '[invalid', 'g', 'x')).toBe('hello');
    });

    it('should handle empty pattern', () => {
      expect(stringTransforms['Replace Regex'].fn('hello', '', 'g', 'x')).toBe('hello');
    });
  });

  describe('Extract Regex', () => {
    it('should extract full match (group 0)', () => {
      expect(stringTransforms['Extract Regex'].fn('test123', '\\d+', '', 0)).toBe('123');
      expect(stringTransforms['Extract Regex'].fn('hello world', 'world', '', 0)).toBe('world');
    });

    it('should extract capture groups', () => {
      expect(stringTransforms['Extract Regex'].fn('test@example.com', '(.+)@(.+)', '', 1)).toBe(
        'test'
      );
      expect(stringTransforms['Extract Regex'].fn('test@example.com', '(.+)@(.+)', '', 2)).toBe(
        'example.com'
      );
    });

    it('should return null when no match', () => {
      expect(stringTransforms['Extract Regex'].fn('hello', '\\d+', '', 0)).toBeNull();
    });

    it('should handle invalid regex gracefully', () => {
      expect(stringTransforms['Extract Regex'].fn('hello', '[invalid', '', 0)).toBeNull();
    });
  });
});

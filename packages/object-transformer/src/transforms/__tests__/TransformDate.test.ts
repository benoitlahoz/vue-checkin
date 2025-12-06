import { describe, it, expect } from 'vitest';

// Test the transform logic directly without mounting Vue components
const dateTransforms = {
  'To ISO String': {
    fn: (v: any) => (v instanceof Date ? v.toISOString() : v),
  },
  'To Locale Date String': {
    fn: (v: any) => (v instanceof Date ? v.toLocaleDateString() : v),
  },
  'To Locale Time String': {
    fn: (v: any) => (v instanceof Date ? v.toLocaleTimeString() : v),
  },
  'Add Days': {
    fn: (v: any, days: number) => {
      if (!(v instanceof Date)) return v;
      const daysToAdd = typeof days === 'number' ? days : 1;
      const date = new Date(v);
      date.setDate(date.getDate() + daysToAdd);
      return date;
    },
  },
  'Subtract Days': {
    fn: (v: any, days: number) => {
      if (!(v instanceof Date)) return v;
      const daysToSubtract = typeof days === 'number' ? days : 1;
      const date = new Date(v);
      date.setDate(date.getDate() - daysToSubtract);
      return date;
    },
  },
  'Get Time': {
    fn: (v: any) => (v instanceof Date ? v.getTime() : v),
  },
  'Get Year': {
    fn: (v: any) => (v instanceof Date ? v.getFullYear() : v),
  },
  'Get Month': {
    fn: (v: any) => (v instanceof Date ? v.getMonth() + 1 : v),
  },
  'Get Day': {
    fn: (v: any) => (v instanceof Date ? v.getDate() : v),
  },
};

describe('TransformDate', () => {
  const testDate = new Date('2024-06-15T12:30:00Z');

  describe('To ISO String', () => {
    it('should convert date to ISO string', () => {
      expect(dateTransforms['To ISO String'].fn(testDate)).toBe('2024-06-15T12:30:00.000Z');
    });

    it('should return non-date values unchanged', () => {
      expect(dateTransforms['To ISO String'].fn('not a date')).toBe('not a date');
    });
  });

  describe('To Locale Date String', () => {
    it('should convert date to locale date string', () => {
      const result = dateTransforms['To Locale Date String'].fn(testDate);
      expect(typeof result).toBe('string');
      expect(result).toContain('2024');
    });
  });

  describe('To Locale Time String', () => {
    it('should convert date to locale time string', () => {
      const result = dateTransforms['To Locale Time String'].fn(testDate);
      expect(typeof result).toBe('string');
    });
  });

  describe('Add Days', () => {
    it('should add days to date', () => {
      const result = dateTransforms['Add Days'].fn(testDate, 5);
      expect(result.getDate()).toBe(20);
      expect(result.getMonth()).toBe(5); // June (0-indexed)
    });

    it('should add negative days', () => {
      const result = dateTransforms['Add Days'].fn(testDate, -5);
      expect(result.getDate()).toBe(10);
    });

    it('should handle month overflow', () => {
      const result = dateTransforms['Add Days'].fn(testDate, 20);
      expect(result.getMonth()).toBe(6); // July
      expect(result.getDate()).toBe(5);
    });
  });

  describe('Subtract Days', () => {
    it('should subtract days from date', () => {
      const result = dateTransforms['Subtract Days'].fn(testDate, 5);
      expect(result.getDate()).toBe(10);
    });

    it('should handle month underflow', () => {
      const result = dateTransforms['Subtract Days'].fn(testDate, 20);
      expect(result.getMonth()).toBe(4); // May
      expect(result.getDate()).toBe(26);
    });
  });

  describe('Get Time', () => {
    it('should return timestamp', () => {
      const result = dateTransforms['Get Time'].fn(testDate);
      expect(result).toBe(testDate.getTime());
      expect(typeof result).toBe('number');
    });
  });

  describe('Get Year', () => {
    it('should return year', () => {
      expect(dateTransforms['Get Year'].fn(testDate)).toBe(2024);
    });
  });

  describe('Get Month', () => {
    it('should return month (1-indexed)', () => {
      expect(dateTransforms['Get Month'].fn(testDate)).toBe(6); // June
    });
  });

  describe('Get Day', () => {
    it('should return day of month', () => {
      expect(dateTransforms['Get Day'].fn(testDate)).toBe(15);
    });
  });
});

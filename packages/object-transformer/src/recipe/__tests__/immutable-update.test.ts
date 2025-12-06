import { describe, it, expect } from 'vitest';
import { updateAt, deleteAt, renameAt, addAt, getAt } from '../../recipe/immutable-update';

describe('immutable-update', () => {
  describe('getAt', () => {
    it('should get value at empty path', () => {
      const data = { name: 'test' };
      expect(getAt(data, [])).toEqual(data);
    });

    it('should get nested value', () => {
      const data = { user: { name: 'Alice', age: 25 } };
      expect(getAt(data, ['user', 'name'])).toBe('Alice');
    });

    it('should get array element', () => {
      const data = { items: [1, 2, 3] };
      expect(getAt(data, ['items', '1'])).toBe(2);
    });

    it('should return undefined for invalid path', () => {
      const data = { user: { name: 'Alice' } };
      expect(getAt(data, ['user', 'invalid'])).toBeUndefined();
    });
  });

  describe('updateAt', () => {
    it('should update value at path', () => {
      const data = { user: { name: 'Alice', age: 25 } };
      const result = updateAt(data, ['user', 'name'], () => 'Bob');

      expect(result).toEqual({ user: { name: 'Bob', age: 25 } });
      expect(data).toEqual({ user: { name: 'Alice', age: 25 } }); // Original unchanged
    });

    it('should update array element', () => {
      const data = { items: [1, 2, 3] };
      const result = updateAt(data, ['items', '1'], () => 99);

      expect(result).toEqual({ items: [1, 99, 3] });
      expect(data.items[1]).toBe(2); // Original unchanged
    });

    it('should update at root', () => {
      const data = { value: 10 };
      const result = updateAt(data, [], () => ({ value: 20 }));
      expect(result).toEqual({ value: 20 });
    });
  });

  describe('deleteAt', () => {
    it('should delete property from object', () => {
      const data = { name: 'Alice', age: 25, city: 'Paris' };
      const result = deleteAt(data, ['age']);

      expect(result).toEqual({ name: 'Alice', city: 'Paris' });
      expect(data).toEqual({ name: 'Alice', age: 25, city: 'Paris' }); // Original unchanged
    });

    it('should delete nested property', () => {
      const data = { user: { name: 'Alice', age: 25 } };
      const result = deleteAt(data, ['user', 'age']);

      expect(result).toEqual({ user: { name: 'Alice' } });
    });

    it('should delete array element', () => {
      const data = { items: [1, 2, 3] };
      const result = deleteAt(data, ['items', '1']);

      expect(result).toEqual({ items: [1, 3] });
      expect(data.items).toHaveLength(3); // Original unchanged
    });
  });

  describe('renameAt', () => {
    it('should rename property', () => {
      const data = { user: { firstName: 'Alice', age: 25 } };
      const result = renameAt(data, ['user'], 'firstName', 'name');

      expect(result).toEqual({ user: { name: 'Alice', age: 25 } });
      expect(data.user).toHaveProperty('firstName'); // Original unchanged
    });

    it('should rename at root level', () => {
      const data = { oldKey: 'value', other: 'data' };
      const result = renameAt(data, [], 'oldKey', 'newKey');

      expect(result).toEqual({ newKey: 'value', other: 'data' });
    });
  });

  describe('addAt', () => {
    it('should add property to object', () => {
      const data = { user: { name: 'Alice' } };
      const result = addAt(data, ['user'], 'age', 25);

      expect(result).toEqual({ user: { name: 'Alice', age: 25 } });
      expect(data.user).not.toHaveProperty('age'); // Original unchanged
    });

    it('should add element to array', () => {
      const data = { items: [1, 2] };
      const result = addAt(data, ['items'], '2', 3);

      expect(result).toEqual({ items: [1, 2, 3] });
      expect(data.items).toHaveLength(2); // Original unchanged
    });

    it('should add at root level', () => {
      const data = { existing: 'value' };
      const result = addAt(data, [], 'newKey', 'newValue');

      expect(result).toEqual({ existing: 'value', newKey: 'newValue' });
    });
  });
});

import { describe, it, expect } from 'vitest';
import { applyRecipe, validateRecipe } from '../../recipe/recipe-applier';
import type { Recipe } from '../../recipe/types';
import type { Transform } from '../../types';

describe('recipe-applier', () => {
  const mockTransforms: Transform[] = [
    {
      name: 'Uppercase',
      applicableTo: ['string'],
      fn: (v: string) => v.toUpperCase(),
    },
    {
      name: 'Double',
      applicableTo: ['number'],
      fn: (v: number) => v * 2,
    },
    {
      name: 'Split',
      applicableTo: ['string'],
      structural: true,
      fn: (v: string, delimiter: string) => ({
        __structuralChange: true,
        action: 'split',
        parts: v.split(delimiter),
      }),
    },
  ];

  describe('applyRecipe', () => {
    it('should apply transform operations', () => {
      const data = { name: 'alice', age: 10 };
      const recipe: Recipe = {
        version: '2.0.0',
        operations: [
          { type: 'transform', path: ['name'], transformName: 'Uppercase', params: [] },
          { type: 'transform', path: ['age'], transformName: 'Double', params: [] },
        ],
        metadata: {
          rootType: 'object',
          createdAt: new Date().toISOString(),
          requiredTransforms: ['Uppercase', 'Double'],
        },
      };

      const result = applyRecipe(data, recipe, mockTransforms);
      expect(result).toEqual({ name: 'ALICE', age: 20 });
    });

    it('should apply rename operations', () => {
      const data = { firstName: 'Alice', age: 25 };
      const recipe: Recipe = {
        version: '2.0.0',
        operations: [{ type: 'rename', path: [], from: 'firstName', to: 'name' }],
        metadata: {
          rootType: 'object',
          createdAt: new Date().toISOString(),
          requiredTransforms: [],
        },
      };

      const result = applyRecipe(data, recipe, mockTransforms);
      expect(result).toEqual({ name: 'Alice', age: 25 });
    });

    it('should apply delete operations', () => {
      const data = { name: 'Alice', age: 25, temp: 'remove' };
      const recipe: Recipe = {
        version: '2.0.0',
        operations: [{ type: 'delete', path: ['temp'] }],
        metadata: {
          rootType: 'object',
          createdAt: new Date().toISOString(),
          requiredTransforms: [],
        },
      };

      const result = applyRecipe(data, recipe, mockTransforms);
      expect(result).toEqual({ name: 'Alice', age: 25 });
    });

    it('should apply add operations', () => {
      const data = { name: 'Alice' };
      const recipe: Recipe = {
        version: '2.0.0',
        operations: [{ type: 'add', path: [], key: 'age', value: 25 }],
        metadata: {
          rootType: 'object',
          createdAt: new Date().toISOString(),
          requiredTransforms: [],
        },
      };

      const result = applyRecipe(data, recipe, mockTransforms);
      expect(result).toEqual({ name: 'Alice', age: 25 });
    });

    it('should apply recipe to array items in template mode', () => {
      const data = [{ name: 'alice' }, { name: 'bob' }];
      const recipe: Recipe = {
        version: '2.0.0',
        operations: [{ type: 'transform', path: ['name'], transformName: 'Uppercase', params: [] }],
        metadata: {
          rootType: 'object',
          createdAt: new Date().toISOString(),
          requiredTransforms: ['Uppercase'],
        },
      };

      const result = applyRecipe(data, recipe, mockTransforms);
      expect(result).toEqual([{ name: 'ALICE' }, { name: 'BOB' }]);
    });
  });

  describe('validateRecipe', () => {
    it('should validate correct recipe', () => {
      const recipe: Recipe = {
        version: '2.0.0',
        operations: [{ type: 'transform', path: ['name'], transformName: 'Uppercase', params: [] }],
        metadata: {
          rootType: 'object',
          requiredTransforms: ['Uppercase'],
          createdAt: new Date().toISOString(),
        },
      };

      const result = validateRecipe(recipe, mockTransforms);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing version', () => {
      const recipe: any = {
        operations: [],
      };

      const result = validateRecipe(recipe, mockTransforms);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Recipe missing version');
    });

    it('should detect missing transforms', () => {
      const recipe: Recipe = {
        version: '2.0.0',
        operations: [],
        metadata: {
          requiredTransforms: ['NonExistent'],
          createdAt: new Date().toISOString(),
          rootType: 'object',
        },
      };

      const result = validateRecipe(recipe, mockTransforms);
      expect(result.valid).toBe(false);
      expect(result.missingTransforms).toContain('NonExistent');
    });

    it('should detect invalid operations', () => {
      const recipe: Recipe = {
        version: '2.0.0',
        operations: [{ type: 'transform', path: ['name'], transformName: '', params: [] }],
      };

      const result = validateRecipe(recipe, mockTransforms);
      expect(result.valid).toBe(false);
    });
  });
});

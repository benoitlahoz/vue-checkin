import { describe, it, expect } from 'vitest';
import { DeltaRecorder } from '../delta-recorder';
import { applyRecipe } from '../delta-applier';
import type { Transform } from '../../types';

describe('UpdateParams Delta Operation', () => {
  const mockTransforms: Transform[] = [
    {
      name: 'Add',
      applicableTo: ['number'],
      fn: (v: number, amount: number = 0) => v + amount,
      params: [
        {
          name: 'amount',
          label: 'Amount to add',
          type: 'number',
          defaultValue: 0,
        },
      ],
    },
    {
      name: 'Multiply',
      applicableTo: ['number'],
      fn: (v: number, factor: number = 1) => v * factor,
      params: [
        {
          name: 'factor',
          label: 'Multiplication factor',
          type: 'number',
          defaultValue: 1,
        },
      ],
    },
    {
      name: 'Uppercase',
      applicableTo: ['string'],
      fn: (v: string) => v.toUpperCase(),
    },
  ];

  describe('recordUpdateParams', () => {
    it('should update parameters of an existing transform', () => {
      const recorder = new DeltaRecorder('object');

      // Record an insert and a transform
      recorder.recordInsert('age', 10);
      recorder.recordTransform('age', 'Add', [5]);

      const recipe = recorder.getRecipe();

      // Verify initial state
      expect(recipe.deltas).toHaveLength(2);
      const transformOp = recipe.deltas[1];
      expect(transformOp.op).toBe('transform');
      if (transformOp.op === 'transform') {
        expect(transformOp.params).toEqual([5]);
      }

      // Update the parameters
      recorder.recordUpdateParams('age', 0, [10]);

      const updatedRecipe = recorder.getRecipe();

      // Verify the TransformOp was updated
      const updatedTransformOp = updatedRecipe.deltas[1];
      expect(updatedTransformOp.op).toBe('transform');
      if (updatedTransformOp.op === 'transform') {
        expect(updatedTransformOp.params).toEqual([10]);
      }

      // Verify UpdateParamsOp was recorded
      expect(updatedRecipe.deltas).toHaveLength(3);
      const updateParamsOp = updatedRecipe.deltas[2];
      expect(updateParamsOp.op).toBe('updateParams');
      if (updateParamsOp.op === 'updateParams') {
        expect(updateParamsOp.key).toBe('age');
        expect(updateParamsOp.transformIndex).toBe(0);
        expect(updateParamsOp.params).toEqual([10]);
      }
    });

    it('should handle multiple transforms on the same key', () => {
      const recorder = new DeltaRecorder('object');

      // Record multiple transforms on the same key
      recorder.recordInsert('age', 10);
      recorder.recordTransform('age', 'Add', [5]); // Index 0
      recorder.recordTransform('age', 'Multiply', [2]); // Index 1

      // Update the second transform
      recorder.recordUpdateParams('age', 1, [3]);

      const recipe = recorder.getRecipe();

      // Check that the second transform was updated
      const transforms = recipe.deltas.filter((d) => d.op === 'transform' && d.key === 'age');
      expect(transforms).toHaveLength(2);

      const secondTransform = transforms[1];
      if (secondTransform.op === 'transform') {
        expect(secondTransform.transformName).toBe('Multiply');
        expect(secondTransform.params).toEqual([3]);
      }
    });

    it('should work when applied to data', () => {
      const recorder = new DeltaRecorder('object');

      // Record operations
      recorder.recordInsert('age', 10);
      recorder.recordTransform('age', 'Add', [5]);

      // Apply recipe with initial params
      let recipe = recorder.getRecipe();
      let data = {};
      let result = applyRecipe(data, recipe, mockTransforms);
      expect(result).toEqual({ age: 15 }); // 10 + 5

      // Update params
      recorder.recordUpdateParams('age', 0, [20]);

      // Apply updated recipe
      recipe = recorder.getRecipe();
      data = {};
      result = applyRecipe(data, recipe, mockTransforms);
      expect(result).toEqual({ age: 30 }); // 10 + 20
    });

    it('should handle chained transforms with parameter updates', () => {
      const recorder = new DeltaRecorder('object');

      // Record chained transforms
      recorder.recordInsert('age', 10);
      recorder.recordTransform('age', 'Add', [5]); // 10 + 5 = 15
      recorder.recordTransform('age', 'Multiply', [2]); // 15 * 2 = 30

      // Apply initial recipe
      let recipe = recorder.getRecipe();
      let data = {};
      let result = applyRecipe(data, recipe, mockTransforms);
      expect(result).toEqual({ age: 30 });

      // Update first transform params
      recorder.recordUpdateParams('age', 0, [10]); // Change Add from 5 to 10

      // Apply updated recipe
      recipe = recorder.getRecipe();
      data = {};
      result = applyRecipe(data, recipe, mockTransforms);
      expect(result).toEqual({ age: 40 }); // (10 + 10) * 2 = 40

      // Update second transform params
      recorder.recordUpdateParams('age', 1, [3]); // Change Multiply from 2 to 3

      // Apply updated recipe
      recipe = recorder.getRecipe();
      data = {};
      result = applyRecipe(data, recipe, mockTransforms);
      expect(result).toEqual({ age: 60 }); // (10 + 10) * 3 = 60
    });

    it('should warn if transform not found', () => {
      const recorder = new DeltaRecorder('object');

      recorder.recordInsert('name', 'alice');
      recorder.recordTransform('name', 'Uppercase', []);

      // Try to update a non-existent transform (wrong key)
      recorder.recordUpdateParams('age', 0, [10]);

      const recipe = recorder.getRecipe();

      // Should still have recorded the UpdateParamsOp
      expect(recipe.deltas).toHaveLength(3);
      const updateOp = recipe.deltas[2];
      expect(updateOp.op).toBe('updateParams');
    });
  });
});

import { describe, it, expect } from 'vitest';
import { DeltaRecorder } from '../delta-recorder';
import { applyRecipe } from '../delta-applier';
import type { Transform } from '../../types';

describe('Condition + Structural Transform Regression', () => {
  const mockTransforms: Transform[] = [
    {
      name: 'Contains',
      applicableTo: ['string'],
      fn: (v: string) => v, // Condition returns value unchanged
      condition: (v: string, search: string) => v.includes(search),
    },
    {
      name: 'Split',
      structural: true,
      applicableTo: ['string'],
      fn: (v: string, delimiter: string) => ({
        __structuralChange: true,
        action: 'split' as const,
        parts: v.split(delimiter),
        removeSource: true,
      }),
    },
  ];

  it('should apply structural transform after condition when condition is met', () => {
    const recorder = new DeltaRecorder('object');
    const sourceData = { name: 'john-doe' };

    // First: Record condition
    recorder.recordTransform('name', 'Contains', ['-'], { isCondition: true });

    // Second: Record structural transform with conditionStack
    const conditionStack = [{ conditionName: 'Contains', conditionParams: ['-'] }];

    recorder.recordInsert('name_0', 'john', {
      sourceKey: 'name',
      createdBy: {
        transformName: 'Split',
        params: ['-'],
        resultKey: 0,
      },
      conditionStack,
    });

    recorder.recordInsert('name_1', 'doe', {
      sourceKey: 'name',
      createdBy: {
        transformName: 'Split',
        params: ['-'],
        resultKey: 1,
      },
      conditionStack,
    });

    recorder.recordDelete('name', { conditionStack });

    const recipe = recorder.getRecipe();

    const result = applyRecipe(sourceData, recipe, mockTransforms, sourceData);

    // When condition is met, structural transform should be applied
    expect(result).toHaveProperty('name_0', 'john');
    expect(result).toHaveProperty('name_1', 'doe');
    expect(result).not.toHaveProperty('name');
  });

  it('should NOT apply structural transform after condition when condition is NOT met', () => {
    const recorder = new DeltaRecorder('object');
    const sourceData = { name: 'johndoe' }; // No dash, condition fails

    // First: Record condition
    recorder.recordTransform('name', 'Contains', ['-'], { isCondition: true });

    // Second: Record structural transform with conditionStack
    const conditionStack = [{ conditionName: 'Contains', conditionParams: ['-'] }];

    recorder.recordInsert('name_0', 'john', {
      sourceKey: 'name',
      createdBy: {
        transformName: 'Split',
        params: ['-'],
        resultKey: 0,
      },
      conditionStack,
    });

    recorder.recordInsert('name_1', 'doe', {
      sourceKey: 'name',
      createdBy: {
        transformName: 'Split',
        params: ['-'],
        resultKey: 1,
      },
      conditionStack,
    });

    recorder.recordDelete('name', { conditionStack });

    const recipe = recorder.getRecipe();
    const result = applyRecipe(sourceData, recipe, mockTransforms, sourceData);

    // When condition is NOT met, structural transform should NOT be applied
    expect(result).toHaveProperty('name', 'johndoe');
    expect(result).not.toHaveProperty('name_0');
    expect(result).not.toHaveProperty('name_1');
  });
});

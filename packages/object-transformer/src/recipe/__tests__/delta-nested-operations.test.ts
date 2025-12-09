import { describe, it, expect } from 'vitest';
import { DeltaRecorder } from '../delta-recorder';
import { applyRecipe } from '../delta-applier';
import type { Transform } from '../../types';

describe('Nested Delta Operations with OpIds', () => {
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
  ];

  describe('Nested Operations with parentOpId', () => {
    it('should apply transform to nested value using parentOpId', () => {
      const recorder = new DeltaRecorder('object');

      // Create a parent object
      const parentOpId = recorder.recordInsert('user', { name: 'alice', age: 25 });
      recorder.registerNodeOperation('node-user', parentOpId);

      // Transform nested property
      recorder.recordTransform('name', 'Uppercase', [], { parentOpId });

      const recipe = recorder.getRecipe();
      const result = applyRecipe({}, recipe, mockTransforms, {});

      expect(result.user.name).toBe('ALICE');
      expect(result.user.age).toBe(25);
    });

    it('should delete nested value using parentOpId', () => {
      const recorder = new DeltaRecorder('object');

      // Create a parent object
      const parentOpId = recorder.recordInsert('user', { name: 'alice', age: 25 });
      recorder.registerNodeOperation('node-user', parentOpId);

      // Delete nested property
      recorder.recordDelete('age', { parentOpId });

      const recipe = recorder.getRecipe();
      const result = applyRecipe({}, recipe, mockTransforms, {});

      expect(result.user).toEqual({ name: 'alice' });
    });

    it('should rename nested value using parentOpId', () => {
      const recorder = new DeltaRecorder('object');

      // Create a parent object
      const parentOpId = recorder.recordInsert('user', { firstName: 'alice', age: 25 });
      recorder.registerNodeOperation('node-user', parentOpId);

      // Rename nested property
      recorder.recordRename('firstName', 'name', { parentOpId });

      const recipe = recorder.getRecipe();
      const result = applyRecipe({}, recipe, mockTransforms, {});

      expect(result.user).toHaveProperty('name');
      expect(result.user).not.toHaveProperty('firstName');
      expect(result.user.name).toBe('alice');
    });

    it('should handle 3-level nesting with parentOpId chain', () => {
      const recorder = new DeltaRecorder('object');

      // Level 1: root object
      const level1OpId = recorder.recordInsert('data', { user: { profile: { name: 'alice' } } });
      recorder.registerNodeOperation('n1', level1OpId);

      // Level 2: nested in data
      const level2OpId = recorder.recordInsert(
        'user',
        { profile: { name: 'alice' } },
        {
          parentOpId: level1OpId,
        }
      );
      recorder.registerNodeOperation('n2', level2OpId);

      // Level 3: nested in user
      const level3OpId = recorder.recordInsert(
        'profile',
        { name: 'alice' },
        {
          parentOpId: level2OpId,
        }
      );
      recorder.registerNodeOperation('n3', level3OpId);

      // Transform at level 3
      recorder.recordTransform('name', 'Uppercase', [], { parentOpId: level3OpId });

      const recipe = recorder.getRecipe();
      const result = applyRecipe({}, recipe, mockTransforms, {});

      expect(result.data.user.profile.name).toBe('ALICE');
    });

    it('should handle multiple operations at different nesting levels', () => {
      const recorder = new DeltaRecorder('object');

      // Create nested structure
      const parentOpId = recorder.recordInsert('user', { name: 'alice', age: 25, city: 'paris' });
      recorder.registerNodeOperation('node-user', parentOpId);

      // Transform nested property
      recorder.recordTransform('name', 'Uppercase', [], { parentOpId });

      // Delete another nested property
      recorder.recordDelete('city', { parentOpId });

      // Add root-level property
      recorder.recordInsert('status', 'active');

      const recipe = recorder.getRecipe();
      const result = applyRecipe({}, recipe, mockTransforms, {});

      expect(result.user.name).toBe('ALICE');
      expect(result.user.age).toBe(25);
      expect(result.user).not.toHaveProperty('city');
      expect(result.status).toBe('active');
    });

    it('should apply transform after rename using opId tracking', () => {
      const recorder = new DeltaRecorder('object');

      // Create object
      const parentOpId = recorder.recordInsert('user', { oldName: 'alice' });
      recorder.registerNodeOperation('node-user', parentOpId);

      // Rename property
      recorder.recordRename('oldName', 'name', { parentOpId });

      // Transform the renamed property (should work because opId tracks the rename)
      recorder.recordTransform('name', 'Uppercase', [], { parentOpId });

      const recipe = recorder.getRecipe();
      const result = applyRecipe({}, recipe, mockTransforms, {});

      expect(result.user).toHaveProperty('name');
      expect(result.user.name).toBe('ALICE');
    });
  });
});

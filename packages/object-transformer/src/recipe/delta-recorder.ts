/**
 * Delta Recorder - Record delta operations
 *
 * Records user actions as delta operations that can be replayed to transform data.
 * Each method adds a delta operation to the recipe.
 */

import { ref, type Ref } from 'vue';
import type { Recipe, InsertOp, DeleteOp, TransformOp, RenameOp } from './types-v4';
import { createRecipe } from './types-v4';
import { logger } from '../utils/logger.util';

/**
 * Delta Recorder
 *
 * Records delta operations for building a recipe.
 * Each method returns the operation ID (index) for tracking.
 */
export class DeltaRecorder {
  recipe: Ref<Recipe>;

  constructor(rootType: 'object' | 'array' = 'object') {
    this.recipe = ref(createRecipe(rootType));
  }

  /**
   * Get the current recipe
   */
  getRecipe(): Recipe {
    return this.recipe.value;
  }

  /**
   * Clear all recorded deltas
   */
  clear(): void {
    this.recipe.value = createRecipe(this.recipe.value.metadata.rootType);
  }

  /**
   * Record an insert operation
   * Used for:
   * - User creates a new property
   * - Structural transform creates new properties (To Object, Split, etc.)
   * - Restore deleted property
   *
   * @param key - Property key to insert
   * @param value - Initial value
   * @param options - Optional metadata
   * @returns Operation ID
   */
  recordInsert(
    key: string,
    value: any,
    options?: {
      sourceKey?: string;
      createdBy?: { transformName: string; params: any[] };
      description?: string;
    }
  ): number {
    const delta: InsertOp = {
      op: 'insert',
      key,
      value,
      sourceKey: options?.sourceKey,
      createdBy: options?.createdBy,
      metadata: {
        description: options?.description,
        timestamp: Date.now(),
      },
    };

    this.recipe.value.deltas.push(delta);
    this.recipe.value.metadata.updatedAt = Date.now();

    logger.debug(`[DeltaRecorder] Insert: ${key}`, delta);
    return this.recipe.value.deltas.length - 1;
  }

  /**
   * Record a delete operation
   * Soft delete - property can be restored
   *
   * @param key - Property key to delete
   * @param options - Optional metadata
   * @returns Operation ID
   */
  recordDelete(
    key: string,
    options?: {
      deletedValue?: any;
      description?: string;
    }
  ): number {
    const delta: DeleteOp = {
      op: 'delete',
      key,
      deletedValue: options?.deletedValue,
      metadata: {
        description: options?.description,
        timestamp: Date.now(),
      },
    };

    this.recipe.value.deltas.push(delta);
    this.recipe.value.metadata.updatedAt = Date.now();

    logger.debug(`[DeltaRecorder] Delete: ${key}`, delta);
    return this.recipe.value.deltas.length - 1;
  }

  /**
   * Record a transform operation
   * Non-structural transforms only
   *
   * @param key - Property key to transform
   * @param transformName - Transform name
   * @param params - Transform parameters
   * @param options - Optional metadata
   * @returns Operation ID
   */
  recordTransform(
    key: string,
    transformName: string,
    params: any[] = [],
    options?: {
      isCondition?: boolean;
      description?: string;
    }
  ): number {
    const delta: TransformOp = {
      op: 'transform',
      key,
      transformName,
      params,
      isCondition: options?.isCondition,
      metadata: {
        description: options?.description,
        timestamp: Date.now(),
      },
    };

    this.recipe.value.deltas.push(delta);
    this.recipe.value.metadata.updatedAt = Date.now();

    logger.debug(`[DeltaRecorder] Transform: ${key} -> ${transformName}`, delta);
    return this.recipe.value.deltas.length - 1;
  }

  /**
   * Record a rename operation
   *
   * @param from - Current key
   * @param to - New key
   * @param options - Optional metadata
   * @returns Operation ID
   */
  recordRename(
    from: string,
    to: string,
    options?: {
      autoRenamed?: boolean;
      description?: string;
    }
  ): number {
    const delta: RenameOp = {
      op: 'rename',
      from,
      to,
      autoRenamed: options?.autoRenamed,
      metadata: {
        description: options?.description,
        timestamp: Date.now(),
      },
    };

    this.recipe.value.deltas.push(delta);
    this.recipe.value.metadata.updatedAt = Date.now();

    logger.debug(`[DeltaRecorder] Rename: ${from} -> ${to}`, delta);
    return this.recipe.value.deltas.length - 1;
  }

  /**
   * Record multiple transforms for a property
   * Helper method that records each transform separately
   *
   * @param key - Property key
   * @param transforms - Array of transforms to apply
   * @returns Array of operation IDs
   */
  recordTransforms(
    key: string,
    transforms: Array<{
      name: string;
      params?: any[];
      isCondition?: boolean;
    }>
  ): number[] {
    return transforms.map((t) =>
      this.recordTransform(key, t.name, t.params || [], {
        isCondition: t.isCondition,
      })
    );
  }

  /**
   * Export recipe as JSON
   */
  exportRecipe(): string {
    return JSON.stringify(this.recipe.value, null, 2);
  }

  /**
   * Import recipe from JSON
   */
  importRecipe(json: string): void {
    try {
      const imported = JSON.parse(json);
      if (imported.version !== '4.0.0') {
        throw new Error(`Invalid recipe version: ${imported.version}`);
      }
      this.recipe.value = imported;
    } catch (error) {
      logger.error('[DeltaRecorder] Failed to import recipe:', error);
      throw error;
    }
  }
}

/**
 * Create a new recorder instance
 */
export const createRecorder = (rootType: 'object' | 'array' = 'object'): DeltaRecorder => {
  return new DeltaRecorder(rootType);
};

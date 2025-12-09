/**
 * Delta Recorder - Record delta operations
 *
 * Records user actions as delta operations that can be replayed to transform data.
 * Each method adds a delta operation to the recipe.
 */

import { ref, type Ref } from 'vue';
import type { Recipe, InsertOp, DeleteOp, TransformOp, RenameOp, UpdateParamsOp } from './types-v4';
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
      conditionStack?: Array<{ conditionName: string; conditionParams: any[] }>;
      description?: string;
    }
  ): number {
    const delta: TransformOp = {
      op: 'transform',
      key,
      transformName,
      params,
      isCondition: options?.isCondition,
      conditionStack: options?.conditionStack,
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
   * Record an update to transform parameters
   * This allows modifying parameters of an existing transform without re-recording
   *
   * This method:
   * 1. Finds the corresponding TransformOp in the recipe's deltas
   * 2. Updates its parameters directly
   * 3. Records an UpdateParamsOp for tracking/undo purposes
   *
   * @param key - Property key where the transform is applied
   * @param transformIndex - Index of the transform in the node's transforms array
   * @param params - New parameters to apply
   * @param options - Optional metadata
   * @returns Operation ID
   */
  recordUpdateParams(
    key: string,
    transformIndex: number,
    params: any[] = [],
    options?: {
      description?: string;
    }
  ): number {
    // Find the corresponding TransformOp in deltas
    // We need to match by key and transform index
    let transformCount = 0;
    let targetDelta: TransformOp | null = null;

    for (const delta of this.recipe.value.deltas) {
      if (delta.op === 'transform' && delta.key === key) {
        if (transformCount === transformIndex) {
          targetDelta = delta;
          break;
        }
        transformCount++;
      }
    }

    if (targetDelta) {
      // Update the parameters of the existing TransformOp
      targetDelta.params = params;
      logger.debug(
        `[DeltaRecorder] Updated TransformOp params: ${key}[${transformIndex}]`,
        targetDelta
      );
    } else {
      logger.warn(
        `[DeltaRecorder] TransformOp not found for updateParams: ${key}[${transformIndex}]`
      );
    }

    // Record the UpdateParamsOp for tracking/history
    const delta: UpdateParamsOp = {
      op: 'updateParams',
      key,
      transformIndex,
      params,
      metadata: {
        description: options?.description,
        timestamp: Date.now(),
      },
    };

    this.recipe.value.deltas.push(delta);
    this.recipe.value.metadata.updatedAt = Date.now();

    logger.debug(`[DeltaRecorder] UpdateParams recorded: ${key}[${transformIndex}]`, delta);
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
   * Remove insert operations created by a structural transform on a specific source key
   * Used when changing or removing structural transforms
   *
   * @param sourceKey - The source key that was transformed (e.g., 'name')
   * @param transformName - The transform name that created the inserts (e.g., 'To Object')
   */
  removeStructuralInserts(sourceKey: string, transformName?: string): void {
    this.recipe.value.deltas = this.recipe.value.deltas.filter((delta) => {
      if (delta.op !== 'insert') return true;

      // Keep if not created by a transform
      if (!delta.createdBy) return true;

      // Remove if created by the specified transform on the specified source
      if (delta.sourceKey === sourceKey) {
        // If transformName specified, only remove inserts from that transform
        if (transformName && delta.createdBy.transformName !== transformName) {
          return true;
        }
        logger.debug(
          `[DeltaRecorder] Removing insert ${delta.key} created by ${delta.createdBy.transformName}`
        );
        return false;
      }

      return true;
    });

    this.recipe.value.metadata.updatedAt = Date.now();
  }

  /**
   * Remove transform operations for a specific key
   * Used when changing from non-structural to structural transform
   *
   * @param key - The property key
   * @param transformName - Optional specific transform name to remove
   */
  removeTransformsByKey(key: string, transformName?: string): void {
    this.recipe.value.deltas = this.recipe.value.deltas.filter((delta) => {
      if (delta.op !== 'transform') return true;

      // Remove transforms for this key
      if (delta.key === key) {
        // If transformName specified, only remove that specific transform
        if (transformName && delta.transformName !== transformName) {
          return true;
        }
        logger.debug(`[DeltaRecorder] Removing transform ${delta.transformName} on ${delta.key}`);
        return false;
      }

      return true;
    });

    this.recipe.value.metadata.updatedAt = Date.now();
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

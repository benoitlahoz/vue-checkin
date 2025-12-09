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
 * Generates unique opIds for tracking operations across renames and nesting.
 */
export class DeltaRecorder {
  recipe: Ref<Recipe>;
  private opIdCounter: number = 0;
  /** Map node IDs to their operation IDs for tracking nested operations */
  private nodeIdToOpId: Map<string, string> = new Map();

  constructor(rootType: 'object' | 'array' = 'object') {
    this.recipe = ref(createRecipe(rootType));
  }

  /**
   * Generate a unique operation ID
   */
  private generateOpId(): string {
    return `op_${++this.opIdCounter}`;
  }

  /**
   * Register a node ID with its operation ID
   * Used to track which operation created which node for nested operations
   */
  registerNodeOperation(nodeId: string, opId: string): void {
    this.nodeIdToOpId.set(nodeId, opId);
  }

  /**
   * Get operation ID for a node ID
   */
  getOpIdForNode(nodeId: string): string | undefined {
    return this.nodeIdToOpId.get(nodeId);
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
   * @returns Operation ID string
   */
  recordInsert(
    key: string,
    value: any,
    options?: {
      parentKey?: string;
      parentOpId?: string;
      sourceKey?: string;
      createdBy?: { transformName: string; params: any[]; resultKey?: string | number };
      conditionStack?: Array<{ conditionName: string; conditionParams: any[] }>;
      description?: string;
    }
  ): string {
    const opId = this.generateOpId();

    const delta: InsertOp = {
      op: 'insert',
      opId,
      key,
      parentKey: options?.parentKey,
      parentOpId: options?.parentOpId,
      value,
      sourceKey: options?.sourceKey,
      createdBy: options?.createdBy,
      conditionStack: options?.conditionStack,
      metadata: {
        description: options?.description,
        timestamp: Date.now(),
      },
    };

    this.recipe.value.deltas.push(delta);
    this.recipe.value.metadata.updatedAt = Date.now();

    return opId;
  }

  /**
   * Record a delete operation
   * Soft delete - property can be restored
   * Supports nested deletes via parentOpId
   *
   * @param key - Property key to delete
   * @param options - Optional metadata including parent information
   * @returns Operation ID string
   */
  recordDelete(
    key: string,
    options?: {
      parentKey?: string;
      parentOpId?: string;
      deletedValue?: any;
      conditionStack?: Array<{ conditionName: string; conditionParams: any[] }>;
      description?: string;
    }
  ): string {
    const opId = this.generateOpId();

    const delta: DeleteOp = {
      op: 'delete',
      opId,
      key,
      parentKey: options?.parentKey,
      parentOpId: options?.parentOpId,
      deletedValue: options?.deletedValue,
      conditionStack: options?.conditionStack,
      metadata: {
        description: options?.description,
        timestamp: Date.now(),
      },
    };

    this.recipe.value.deltas.push(delta);
    this.recipe.value.metadata.updatedAt = Date.now();

    return opId;
  }

  /**
   * Record a transform operation
   * Non-structural transforms only
   *
   * @param key - Property key to transform
   * @param transformName - Transform name
   * @param params - Transform parameters
   * @param options - Optional metadata
   * @returns Operation ID string
   */
  recordTransform(
    key: string,
    transformName: string,
    params: any[] = [],
    options?: {
      parentKey?: string;
      parentOpId?: string;
      isCondition?: boolean;
      conditionStack?: Array<{ conditionName: string; conditionParams: any[] }>;
      description?: string;
    }
  ): string {
    const opId = this.generateOpId();

    const delta: TransformOp = {
      op: 'transform',
      opId,
      key,
      parentKey: options?.parentKey,
      parentOpId: options?.parentOpId,
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

    return opId;
  }

  /**
   * Record a rename operation
   *
   * @param from - Current key
   * @param to - New key
   * @param options - Optional metadata
   * @returns Operation ID string
   */
  recordRename(
    from: string,
    to: string,
    options?: {
      parentKey?: string;
      parentOpId?: string;
      autoRenamed?: boolean;
      description?: string;
    }
  ): string {
    const opId = this.generateOpId();

    const delta: RenameOp = {
      op: 'rename',
      opId,
      from,
      to,
      parentKey: options?.parentKey,
      parentOpId: options?.parentOpId,
      autoRenamed: options?.autoRenamed,
      metadata: {
        description: options?.description,
        timestamp: Date.now(),
      },
    };

    this.recipe.value.deltas.push(delta);
    this.recipe.value.metadata.updatedAt = Date.now();

    return opId;
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
   * @returns Operation ID string
   */
  recordUpdateParams(
    key: string,
    transformIndex: number,
    params: any[] = [],
    options?: {
      description?: string;
    }
  ): string {
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
    } else {
      logger.warn(
        `[DeltaRecorder] TransformOp not found for updateParams: ${key}[${transformIndex}]`
      );
    }

    const opId = this.generateOpId();

    // Record the UpdateParamsOp for tracking/history
    const delta: UpdateParamsOp = {
      op: 'updateParams',
      opId,
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

    return opId;
  }

  /**
   * Update parameters of InsertOps created by a structural transform
   * This is used when user changes parameters of a structural transform (Split, To Object, etc.)
   *
   * Strategy: Remove all old InsertOps and let propagation create new ones with correct count
   *
   * @param sourceKey - The key of the source property that was split
   * @param transformName - Name of the structural transform
   * @param newParams - New parameters to apply (unused - kept for API compatibility)
   */
  updateStructuralInsertParams(sourceKey: string, transformName: string, _newParams: any[]): void {
    // Remove all InsertOps that were created by this structural transform
    // The propagation will create new ones with the correct number of elements
    this.recipe.value.deltas = this.recipe.value.deltas.filter(
      (delta) =>
        !(
          delta.op === 'insert' &&
          delta.sourceKey === sourceKey &&
          delta.createdBy?.transformName === transformName
        )
    );

    this.recipe.value.metadata.updatedAt = Date.now();
  }

  /**
   * Update condition parameters in the conditionStack of all affected operations
   * This is used when user changes parameters of a condition
   *
   * @param key - The key of the property where the condition is applied
   * @param conditionName - Name of the condition
   * @param newParams - New parameters to apply
   */
  updateConditionParams(key: string, conditionName: string, newParams: any[]): void {
    // Find all TransformOps and InsertOps for this key and update their conditionStack
    for (const delta of this.recipe.value.deltas) {
      if (
        (delta.op === 'transform' || delta.op === 'insert') &&
        delta.key === key &&
        delta.conditionStack
      ) {
        // Update the condition params in the stack
        for (const condition of delta.conditionStack) {
          if (condition.conditionName === conditionName) {
            condition.conditionParams = newParams;
          }
        }
      }
    }

    this.recipe.value.metadata.updatedAt = Date.now();
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
  ): string[] {
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

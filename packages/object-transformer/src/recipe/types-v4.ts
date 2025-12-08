/**
 * Recipe Types v4.0.0 - Delta-based (inspired by Quill Delta)
 *
 * Delta operations are sequential and relative, avoiding fragile path-based addressing.
 * Each operation modifies the object in-place, similar to text editing deltas.
 */

/**
 * Delta Operations
 * Operations are applied sequentially to transform an object.
 */
export type DeltaOp = RetainOp | InsertOp | DeleteOp | TransformOp | RenameOp;

/**
 * Retain operation - skip N properties
 * Used to maintain position in sequential application
 */
export interface RetainOp {
  op: 'retain';
  /** Number of properties to skip */
  count: number;
}

/**
 * Insert operation - add a new property
 * Records both user-created properties and structural transform results
 */
export interface InsertOp {
  op: 'insert';
  /** Property key to insert */
  key: string;
  /** Initial value (can be primitive or object) */
  value: any;
  /** Optional: source key for restore operations (maps to original sourceData key) */
  sourceKey?: string;
  /** Optional: if this property was created by a structural transform */
  createdBy?: {
    transformName: string;
    params: any[];
  };
  /** Optional: metadata for debugging */
  metadata?: {
    description?: string;
    timestamp?: number;
  };
}

/**
 * Delete operation - remove a property
 * Soft delete - property can be restored
 */
export interface DeleteOp {
  op: 'delete';
  /** Property key to delete */
  key: string;
  /** Optional: store deleted value for potential undo */
  deletedValue?: any;
  /** Optional: metadata */
  metadata?: {
    description?: string;
    timestamp?: number;
  };
}

/**
 * Transform operation - apply transformation to a property value
 * Non-structural transforms only (structural transforms create InsertOp)
 */
export interface TransformOp {
  op: 'transform';
  /** Property key to transform */
  key: string;
  /** Transform name */
  transformName: string;
  /** Transform parameters */
  params: any[];
  /** If this is a conditional transform */
  isCondition?: boolean;
  /** Optional: metadata */
  metadata?: {
    description?: string;
    timestamp?: number;
  };
}

/**
 * Rename operation - change property key
 */
export interface RenameOp {
  op: 'rename';
  /** Current key */
  from: string;
  /** New key */
  to: string;
  /** Optional: if this was an auto-rename to avoid conflicts */
  autoRenamed?: boolean;
  /** Optional: metadata */
  metadata?: {
    description?: string;
    timestamp?: number;
  };
}

/**
 * Recipe v4.0.0 - Delta-based
 */
export interface Recipe {
  /** Recipe format version */
  version: '4.0.0';
  /** Sequential list of delta operations */
  deltas: DeltaOp[];
  /** Recipe metadata */
  metadata: RecipeMetadata;
}

/**
 * Recipe metadata
 */
export interface RecipeMetadata {
  /** Root data type (object or array) */
  rootType: 'object' | 'array';
  /** Creation timestamp */
  createdAt: number;
  /** Last modification timestamp */
  updatedAt: number;
  /** Optional description */
  description?: string;
  /** Optional tags for categorization */
  tags?: string[];
}

/**
 * Recipe validation result
 */
export interface RecipeValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Delta composition result
 * Combines two delta sequences into one
 */
export interface DeltaComposition {
  deltas: DeltaOp[];
  conflicts: string[];
}

/**
 * Type guards
 */
export const isRetainOp = (op: DeltaOp): op is RetainOp => op.op === 'retain';
export const isInsertOp = (op: DeltaOp): op is InsertOp => op.op === 'insert';
export const isDeleteOp = (op: DeltaOp): op is DeleteOp => op.op === 'delete';
export const isTransformOp = (op: DeltaOp): op is TransformOp => op.op === 'transform';
export const isRenameOp = (op: DeltaOp): op is RenameOp => op.op === 'rename';

/**
 * Helper: Create empty recipe
 */
export const createRecipe = (rootType: 'object' | 'array' = 'object'): Recipe => ({
  version: '4.0.0',
  deltas: [],
  metadata: {
    rootType,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
});

/**
 * Helper: Validate recipe structure
 */
export const validateRecipe = (recipe: any): RecipeValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!recipe) {
    errors.push('Recipe is null or undefined');
    return { valid: false, errors, warnings };
  }

  if (recipe.version !== '4.0.0') {
    errors.push(`Invalid version: expected "4.0.0", got "${recipe.version}"`);
  }

  if (!Array.isArray(recipe.deltas)) {
    errors.push('Recipe.deltas must be an array');
  } else {
    recipe.deltas.forEach((delta: any, index: number) => {
      if (!delta.op) {
        errors.push(`Delta at index ${index} missing "op" field`);
        return;
      }

      const validOps = ['retain', 'insert', 'delete', 'transform', 'rename'];
      if (!validOps.includes(delta.op)) {
        errors.push(`Invalid op "${delta.op}" at index ${index}`);
      }

      // Validate specific fields
      switch (delta.op) {
        case 'retain':
          if (typeof delta.count !== 'number' || delta.count <= 0) {
            errors.push(`RetainOp at index ${index} must have positive count`);
          }
          break;
        case 'insert':
          if (!delta.key || typeof delta.key !== 'string') {
            errors.push(`InsertOp at index ${index} must have string key`);
          }
          break;
        case 'delete':
          if (!delta.key || typeof delta.key !== 'string') {
            errors.push(`DeleteOp at index ${index} must have string key`);
          }
          break;
        case 'transform':
          if (!delta.key || typeof delta.key !== 'string') {
            errors.push(`TransformOp at index ${index} must have string key`);
          }
          if (!delta.transformName || typeof delta.transformName !== 'string') {
            errors.push(`TransformOp at index ${index} must have transformName`);
          }
          break;
        case 'rename':
          if (!delta.from || typeof delta.from !== 'string') {
            errors.push(`RenameOp at index ${index} must have string "from"`);
          }
          if (!delta.to || typeof delta.to !== 'string') {
            errors.push(`RenameOp at index ${index} must have string "to"`);
          }
          break;
      }
    });
  }

  if (!recipe.metadata) {
    errors.push('Recipe must have metadata');
  } else {
    if (!recipe.metadata.rootType || !['object', 'array'].includes(recipe.metadata.rootType)) {
      errors.push('Recipe.metadata.rootType must be "object" or "array"');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

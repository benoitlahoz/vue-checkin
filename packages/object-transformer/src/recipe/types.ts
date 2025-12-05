/**
 * Recipe System v2 - Functional & Immutable
 *
 * Core types for the new recipe architecture based on:
 * - Pure functions (no side effects)
 * - Immutable data structures
 * - Operation composition
 * - Vue reactivity primitives
 */

export const RECIPE_VERSION = '2.0.0';

/**
 * Path: simple array of keys from root to target
 * Always uses the CURRENT keys (after renames are applied)
 */
export type Path = string[];

/**
 * Operation: atomic transformation that can be applied to data
 * All operations are pure functions: data -> data'
 */
export type Operation = TransformOp | RenameOp | DeleteOp | AddOp;

/**
 * Transform operation: applies a registered transform function
 */
export interface TransformOp {
  type: 'transform';
  path: Path;
  transformName: string;
  params: any[];
}

/**
 * Rename operation: changes a key name at a specific location
 */
export interface RenameOp {
  type: 'rename';
  path: Path; // Path to the parent object
  from: string; // Original key name
  to: string; // New key name
}

/**
 * Delete operation: removes a value at a specific path
 */
export interface DeleteOp {
  type: 'delete';
  path: Path; // Path to the value to delete
}

/**
 * Add operation: adds a new property/element
 */
export interface AddOp {
  type: 'add';
  path: Path; // Path to the parent
  key: string; // Key of the new element
  value: any; // Initial value
}

/**
 * Recipe metadata
 */
export interface RecipeMetadata {
  createdAt: string;
  requiredTransforms: string[];
  rootType: 'object' | 'array';
  description?: string;
}

/**
 * Recipe: ordered list of operations to transform data
 */
export interface Recipe {
  version: string;
  operations: Operation[];
  metadata?: RecipeMetadata;
}

/**
 * Operation applicator function type
 */
export type OperationApplicator = (data: any, operation: Operation) => any;

/**
 * Recipe validation result
 */
export interface RecipeValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingTransforms: string[];
}

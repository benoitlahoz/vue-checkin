/**
 * Recipe System v2 - Public API
 *
 * Exports all recipe-related types and functions.
 * This is the new, functional, immutable recipe system.
 */

// Types
export type {
  Path,
  Operation,
  TransformOp,
  RenameOp,
  DeleteOp,
  AddOp,
  Recipe,
  RecipeMetadata,
  RecipeValidation,
} from './types';

export { RECIPE_VERSION } from './types';

// Immutable updates
export { updateAt, deleteAt, renameAt, addAt, getAt, hasPath } from './immutable-update';

// Operations
export {
  applyTransform,
  applyRename,
  applyDelete,
  applyAdd,
  applyOperation,
  applyOperations,
} from './operations';

// Builder (tree-based - legacy)
export { buildRecipe, exportRecipe, importRecipe } from './recipe-builder';

// Recorder (delta-based - new)
export { createRecipeRecorder } from './recipe-recorder';
export type { RecipeRecorder } from './recipe-recorder';

// Applier
export { applyRecipe, validateRecipe } from './recipe-applier';

// Vue integration
export { createReactiveRecipe } from './recipe-reactive';

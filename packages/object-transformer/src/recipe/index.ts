/**
 * Recipe System v4.0 - Public API
 *
 * Delta-based recipe system inspired by Quill Delta.
 * Sequential operations without fragile path-based addressing.
 */

// Types v4.0
export type {
  DeltaOp,
  RetainOp,
  InsertOp,
  DeleteOp,
  TransformOp,
  RenameOp,
  Recipe,
  RecipeMetadata,
  RecipeValidation,
  DeltaComposition,
} from './types-v4';

export {
  isRetainOp,
  isInsertOp,
  isDeleteOp,
  isTransformOp,
  isRenameOp,
  createRecipe,
  validateRecipe,
} from './types-v4';

// Delta Applier
export { applyRecipe, applyDeltas, composeDeltas, transformDeltas } from './delta-applier';

// Delta Recorder
export { DeltaRecorder, createRecorder } from './delta-recorder';

// Immutable updates (still useful)
export { updateAt, deleteAt, renameAt, addAt, getAt, hasPath } from './immutable-update';

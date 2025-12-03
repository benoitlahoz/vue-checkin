import { registerStructuralTransformHandler } from './structural-transform-handlers.util';

/**
 * Register common structural transform handlers
 * These handlers are shared across all primitive types
 */

// Generic toObject handler - works for all primitive types
registerStructuralTransformHandler('toObject', (current, lastKey, result) => {
  if (!result.object) return;

  // Create multiple properties from the object
  Object.entries(result.object).forEach(([key, value]) => {
    const newKey = `${lastKey}_${key}`;
    current[newKey] = value;
  });

  // Remove source if specified
  if (result.removeSource) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete current[lastKey];
  }
});

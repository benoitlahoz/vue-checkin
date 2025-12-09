import { registerStructuralTransformHandler } from './structural-transform-handlers.util';
import type { ObjectTransformerContext } from '../../types';

/**
 * Register common structural transform handlers
 * These handlers are shared across all primitive types
 * Call this function with the desk context to register handlers
 */
export const registerCommonStructuralHandlers = (desk?: ObjectTransformerContext): void => {
  // Generic toObject handler - works for all primitive types
  registerStructuralTransformHandler(
    'toObject',
    (current, lastKey, result) => {
      if (!result.object) return;

      // 🔍 DEBUG: Check if recorder exists
      console.log('[toObject handler] desk:', desk);
      console.log('[toObject handler] desk?.recorder:', desk?.recorder);
      console.log('[toObject handler] result.object:', result.object);

      // Create multiple properties from the object
      Object.entries(result.object).forEach(([key, value]) => {
        const newKey = `${lastKey}_${key}`;
        current[newKey] = value;

        // 🟢 RECORD INSERT for each created property
        if (desk?.recorder) {
          console.log('[toObject] Recording insert:', newKey, value);
          desk.recorder.recordInsert(newKey, value, {
            sourceKey: lastKey,
            createdBy: {
              transformName: 'To Object',
              params: [],
            },
            description: `Created by toObject transformation on ${lastKey}`,
          });
        } else {
          console.warn('[toObject] No recorder available!');
        }
      });

      // Remove source if specified
      if (result.removeSource) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete current[lastKey];

        // 🟢 RECORD DELETE for source property
        if (desk?.recorder) {
          desk.recorder.recordDelete(lastKey, {
            description: `Removed by toObject transformation`,
          });
        }
      }
    },
    desk
  );

  // Conditional branch handler - creates _if and _else branches
  registerStructuralTransformHandler(
    'conditionalBranch',
    (current, lastKey, result) => {
      if (result.value === undefined) return;

      // Create two branches with the same value
      // They will diverge when different transforms are applied
      current[`${lastKey}_if`] = result.value;
      current[`${lastKey}_else`] = result.value;

      // Remove source if specified
      if (result.removeSource) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete current[lastKey];
      }
    },
    desk
  );
};

/**
 * Structural Transform Handlers
 * Registry and handlers for structural transformations
 */

/**
 * Structural transform handler type
 */
export type StructuralTransformHandler = (current: any, lastKey: string, result: any) => void;

/**
 * Registry of structural transform handlers
 * Handlers are registered by Transform components
 */
const structuralTransformHandlers: Record<string, StructuralTransformHandler> = {};

/**
 * Register a new structural transform handler
 */
export const registerStructuralTransformHandler = (
  action: string,
  handler: StructuralTransformHandler
): void => {
  // Only register if not already registered (avoid warning on hot reload)
  if (structuralTransformHandlers[action]) {
    return;
  }
  structuralTransformHandlers[action] = handler;
};

/**
 * Get a structural transform handler by action name
 */
export const getStructuralTransformHandler = (
  action: string
): StructuralTransformHandler | undefined => {
  return structuralTransformHandlers[action];
};

/**
 * Check if a handler exists for a specific action
 */
export const hasStructuralTransformHandler = (action: string): boolean => {
  return action in structuralTransformHandlers;
};

/**
 * Get all registered action names
 */
export const getRegisteredActions = (): string[] => {
  return Object.keys(structuralTransformHandlers);
};

/**
 * Check if an action creates multiple child nodes
 * Used by propagation to determine if structural split handling is needed
 */
export const isMultiPartAction = (action: string): boolean => {
  // Simply check if a handler is registered for this action
  return hasStructuralTransformHandler(action);
};

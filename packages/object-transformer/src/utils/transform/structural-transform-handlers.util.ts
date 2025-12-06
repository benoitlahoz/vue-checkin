/**
 * Structural Transform Handlers
 * Registry and handlers for structural transformations
 * The registry is now stored in the desk context to avoid module duplication issues
 */

import type { ObjectTransformerContext, StructuralTransformResult } from '../../types';
import { logger } from '../logger.util';

/**
 * Structural transform handler type
 */
export type StructuralTransformHandler = (
  current: Record<string, unknown>,
  lastKey: string,
  result: StructuralTransformResult
) => void;

/**
 * Get the handlers registry from desk context
 * @param desk The ObjectTransformer desk context
 */
const getHandlersRegistry = (
  desk?: ObjectTransformerContext
): Record<string, StructuralTransformHandler> => {
  if (!desk) {
    logger.warn('No desk context available for structural handlers');
    return {};
  }
  return desk.structuralTransformHandlers;
};

/**
 * Register a new structural transform handler
 * @param action The action name
 * @param handler The handler function
 * @param desk The ObjectTransformer desk context
 */
export const registerStructuralTransformHandler = (
  action: string,
  handler: StructuralTransformHandler,
  desk?: ObjectTransformerContext
): void => {
  const registry = getHandlersRegistry(desk);

  // Only register if not already registered (avoid warning on hot reload)
  if (registry[action]) {
    return;
  }
  registry[action] = handler;
};

/**
 * Get a structural transform handler by action name
 * @param action The action name
 * @param desk The ObjectTransformer desk context
 */
export const getStructuralTransformHandler = (
  action: string,
  desk?: ObjectTransformerContext
): StructuralTransformHandler | undefined => {
  const registry = getHandlersRegistry(desk);
  return registry[action];
};

/**
 * Check if a handler exists for a specific action
 * @param action The action name
 * @param desk The ObjectTransformer desk context
 */
export const hasStructuralTransformHandler = (
  action: string,
  desk?: ObjectTransformerContext
): boolean => {
  const registry = getHandlersRegistry(desk);
  return action in registry;
};

/**
 * Get all registered action names
 * @param desk The ObjectTransformer desk context
 */
export const getRegisteredActions = (desk?: ObjectTransformerContext): string[] => {
  const registry = getHandlersRegistry(desk);
  return Object.keys(registry);
};

/**
 * Check if an action creates multiple child nodes
 * Used by propagation to determine if structural split handling is needed
 * @param action The action name
 * @param desk The ObjectTransformer desk context
 */
export const isMultiPartAction = (action: string, desk?: ObjectTransformerContext): boolean => {
  return hasStructuralTransformHandler(action, desk);
};

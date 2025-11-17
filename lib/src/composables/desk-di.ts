/**
 * Dependency injection functionality for check-in desk.
 * Simplified system using Symbol-based injection keys.
 */

import {
  provide,
  type InjectionKey,
} from 'vue';
import type { DeskCore } from './desk-core';

// ==========================================
// TYPES
// ==========================================

export interface DeskWithContext<T = any, TContext extends Record<string, any> = {}> 
  extends DeskCore<T> {
  context?: TContext;
}

// ==========================================
// DEBUG HELPERS
// ==========================================

const NoOpDebug = (_message: string, ..._args: any[]) => {};
const Debug = (message: string, ...args: any[]) => {
  console.log(`[DeskDI] ${message}`, ...args);
};

// ==========================================
// INJECTION KEY HELPERS
// ==========================================

/**
 * Creates a typed injection key for a desk.
 * Simplified: always creates a Symbol, no double provide.
 * 
 * @param name - Desk name (will be used in Symbol description)
 * @returns Typed InjectionKey
 * 
 * @example
 * ```ts
 * const tabsDeskKey = createDeskKey<TabItem>('tabs');
 * 
 * // In parent:
 * const { desk } = provideDesk(tabsDeskKey, { ... });
 * 
 * // In child:
 * const { desk } = checkIn(tabsDeskKey, { ... });
 * ```
 */
export const createDeskKey = <T = any, TContext extends Record<string, any> = {}>(
  name: string
): InjectionKey<DeskWithContext<T, TContext>> => {
  return Symbol(`CheckInDesk:${name}`) as InjectionKey<DeskWithContext<T, TContext>>;
};

// ==========================================
// PROVIDE DESK
// ==========================================

export interface ProvideDeskResult<T = any, TContext extends Record<string, any> = {}> {
  desk: DeskWithContext<T, TContext>;
  injectionKey: InjectionKey<DeskWithContext<T, TContext>>;
}

/**
 * Provides a desk to child components via dependency injection.
 * Simplified: uses Symbol-based keys only, no string fallback.
 * 
 * @param injectionKey - Symbol or string key for injection
 * @param desk - The desk core to provide
 * @param context - Optional context to merge with desk
 * @param debug - Enable debug logging
 * 
 * @example
 * ```ts
 * // Create key
 * const tabsDeskKey = createDeskKey<TabItem>('tabs');
 * 
 * // Create desk
 * const desk = createDeskCore<TabItem>({ ... });
 * 
 * // Provide with context
 * const { desk: fullDesk } = provideDesk(tabsDeskKey, desk, {
 *   activeTab: ref('tab1')
 * });
 * ```
 */
export const provideDesk = <T = any, TContext extends Record<string, any> = {}>(
  injectionKey: InjectionKey<DeskWithContext<T, TContext>> | string,
  desk: DeskCore<T>,
  context?: TContext,
  debug = false
): ProvideDeskResult<T, TContext> => {
  const logger = debug ? Debug : NoOpDebug;
  
  let key: InjectionKey<DeskWithContext<T, TContext>>;
  
  // If it's a string, create a Symbol key
  if (typeof injectionKey === 'string') {
    key = createDeskKey<T, TContext>(injectionKey);
    logger('Created Symbol key from string:', injectionKey);
  } else {
    key = injectionKey;
  }
  
  // Merge desk with context
  const fullDesk = {
    ...desk,
    ...(context || {}),
  } as DeskWithContext<T, TContext>;

  // Single provide with Symbol key
  provide(key, fullDesk);
  
  logger('Desk provided with key:', key.description);

  return {
    desk: fullDesk,
    injectionKey: key,
  };
};

/**
 * Legacy support: converts string to Symbol key.
 * Use createDeskKey() directly for new code.
 * 
 * @deprecated Use createDeskKey() instead
 */
export const deskKey = createDeskKey;

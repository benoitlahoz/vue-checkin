/**
 * Dependency injection functionality for check-in desk.
 * Simplified system using Symbol-based injection keys.
 */

import { provide, type InjectionKey } from 'vue';
import type { DeskCore } from './desk-core';
import { NoOp, Debug } from './utils';

export interface DeskWithContext<T = any, TContext extends Record<string, any> = {}>
  extends DeskCore<T> {
  context?: TContext;
}

export interface ProvideDeskResult<T = any, TContext extends Record<string, any> = {}> {
  desk: DeskWithContext<T, TContext>;
  injectionKey: InjectionKey<DeskWithContext<T, TContext>>;
}

const DebugPrefix = '[DeskInjection]';

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
  injectionKey: InjectionKey<DeskWithContext<T, TContext>>,
  desk: DeskCore<T>,
  context?: TContext,
  debug = false
): ProvideDeskResult<T, TContext> => {
  const logger = debug ? Debug : NoOp;

  // Merge desk with context
  const fullDesk = {
    ...desk,
    ...(context || {}),
  } as DeskWithContext<T, TContext>;

  // Single provide with Symbol key
  provide(injectionKey, fullDesk);

  logger(`${DebugPrefix} Desk provided with key:`, injectionKey.description);

  return {
    desk: fullDesk,
    injectionKey,
  };
};

/**
 * DevTools integration helper
 * Emits events to DevTools hook when available (dev mode only)
 */

export interface DevToolsEvent {
  type: 'check-in' | 'check-out' | 'update' | 'plugin-execute' | 'clear';
  timestamp: number;
  deskId: string;
  childId?: string | number;
  pluginName?: string;
  duration?: number;
  data?: Record<string, unknown>;
}

export interface DevToolsHook {
  emit(event: DevToolsEvent): void;
  registerDesk(deskId: string, metadata: Record<string, unknown>): void;
  updateRegistry(deskId: string, registry: Map<string | number, any>): void;
}

const HOOK_KEY = '__VUE_CHECKIN_DEVTOOLS_HOOK__';

declare global {
  interface Window {
    [HOOK_KEY]?: DevToolsHook;
  }
}

/**
 * Emit event to DevTools (noop if not available)
 */
export function emitDevToolsEvent(event: DevToolsEvent): void {
  if (typeof window !== 'undefined' && window[HOOK_KEY]) {
    try {
      window[HOOK_KEY].emit(event);
    } catch (error) {
      // Silently fail in production
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[vue-checkin] DevTools event failed:', error);
      }
    }
  }
}

/**
 * Register desk with DevTools
 */
export function registerDeskWithDevTools(deskId: string, metadata: Record<string, unknown>): void {
  if (typeof window !== 'undefined' && window[HOOK_KEY]) {
    try {
      window[HOOK_KEY].registerDesk(deskId, metadata);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[vue-checkin] DevTools registerDesk failed:', error);
      }
    }
  }
}

/**
 * Update registry state in DevTools
 */
export function updateDevToolsRegistry(deskId: string, registry: Map<string | number, any>): void {
  if (typeof window !== 'undefined' && window[HOOK_KEY]) {
    try {
      window[HOOK_KEY].updateRegistry(deskId, registry);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[vue-checkin] DevTools updateRegistry failed:', error);
      }
    }
  }
}

/**
 * Check if DevTools are available
 */
export function hasDevTools(): boolean {
  return typeof window !== 'undefined' && !!window[HOOK_KEY];
}

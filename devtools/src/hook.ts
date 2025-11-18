import type { App } from 'vue';
import type { AirportEvent } from './types';

export interface DeskRegistryState {
  deskId: string;
  registry: Map<string | number, any>;
  metadata?: Record<string, unknown>;
}

export interface CheckInDevToolsHook {
  events: AirportEvent[];
  desks: Map<string, DeskRegistryState>;
  emit(event: AirportEvent): void;
  on(handler: (event: AirportEvent) => void): () => void;
  registerDesk(deskId: string, metadata: Record<string, unknown>): void;
  updateRegistry(deskId: string, registry: Map<string | number, any>): void;
}

const HOOK_KEY = '__VUE_AIRPORT_DEVTOOLS_HOOK__';

declare global {
  interface Window {
    [HOOK_KEY]?: CheckInDevToolsHook;
  }
}

export function attachGlobalHook(app: App) {
  const handlers = new Set<(event: AirportEvent) => void>();
  const desks = new Map<string, DeskRegistryState>();

  const hook: CheckInDevToolsHook = {
    events: [],
    desks,
    emit(event: AirportEvent) {
      this.events.push(event);
      handlers.forEach((handler) => handler(event));
    },
    on(handler: (event: AirportEvent) => void) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    registerDesk(deskId: string, metadata: Record<string, unknown>) {
      desks.set(deskId, { deskId, registry: new Map(), metadata });
    },
    updateRegistry(deskId: string, registry: Map<string | number, any>) {
      const existing = desks.get(deskId);
      if (existing) {
        existing.registry = new Map(registry); // Clone to avoid mutation issues
      } else {
        desks.set(deskId, { deskId, registry: new Map(registry) });
      }
    },
  };

  if (typeof window !== 'undefined') {
    window[HOOK_KEY] = hook;
  }

  // Cleanup on unmount
  app.config.globalProperties.$checkInDevToolsHook = hook;
}

export function getGlobalHook(): CheckInDevToolsHook | undefined {
  if (typeof window !== 'undefined') {
    return window[HOOK_KEY];
  }
}

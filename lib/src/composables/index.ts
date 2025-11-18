// ==========================================
// MAIN COMPOSABLE
// ==========================================

export { useCheckIn } from './useCheckIn';

// ==========================================
// CORE MODULES (Modular architecture)
// ==========================================

export {
  createDeskCore,
  type DeskCore,
  type DeskEventType,
  type DeskEventCallback,
  type CheckInItem,
  type DeskCoreOptions,
} from './desk-core';

export { provideDesk, type DeskWithContext } from './desk-injection';

export { checkInToDesk, type CheckInOptions, type CheckInResult } from './desk-child';

// ==========================================
// HELPERS
// ==========================================

export { generateId, memoizedId, clearIdCache, isCheckedIn, getRegistry } from './useCheckIn';

// ==========================================
// PLUGIN SYSTEM
// ==========================================

export type { CheckInPlugin } from './types';

// Built-in plugins
export {
  createActiveItemPlugin,
  createValidationPlugin,
  createHistoryPlugin,
  createDebouncePlugin,
} from '../plugins';

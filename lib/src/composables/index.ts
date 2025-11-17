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

export {
  createDeskKey,
  provideDesk,
  deskKey, // Legacy support
  type DeskWithContext,
} from './desk-di';

export {
  checkInToDesk,
  type CheckInOptions,
  type CheckInResult,
} from './desk-child';

// ==========================================
// HELPERS
// ==========================================

export {
  generateId,
  memoizedId,
  clearIdCache,
  isCheckedIn,
  getRegistry,
} from './useCheckIn';

// ==========================================
// PLUGIN SYSTEM
// ==========================================

export type { CheckInPlugin } from './types';

// Built-in plugins
export {
  createActiveItemPlugin, 
  createValidationPlugin,
  createLoggerPlugin,
  createHistoryPlugin,
} from '../plugins';

  
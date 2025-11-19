export { useCheckIn } from './useCheckIn';

export {
  createDeskCore,
  type DeskCore,
  type DeskEventType,
  type DeskEventCallback,
  type CheckInItem,
  type DeskCoreOptions,
} from './desk/desk-core';

export { provideDesk, type DeskWithContext } from './desk/desk-injection';

export { checkInToDesk, type CheckInOptions, type CheckInResult } from './desk/desk-child';
// ==========================================
// HELPERS
// ==========================================

export { generateId, memoizedId, clearIdCache, isCheckedIn, getRegistry } from './useCheckIn';

export type { CheckInPlugin } from './types';

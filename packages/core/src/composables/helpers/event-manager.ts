import { nextTick } from 'vue';
import type { DeskEventType, DeskEventCallback } from '../desk/desk-core';
import { NoOp, Debug } from '../utils';

const DebugPrefix = '[EventManager]';

/**
 * Event manager for desks.
 * Handles event listeners and event emission with batching.
 */
export class EventManager<T = any> {
  public eventListeners = new Map<DeskEventType, Set<DeskEventCallback<T>>>();
  private eventBatcher: EventBatcher<T>;
  private debug = NoOp;

  constructor({ debug }: { debug?: boolean } = { debug: false }) {
    if (debug) {
      this.debug = Debug;
    }
    this.eventBatcher = new EventBatcher<T>(this.eventListeners);
  }

  public on(event: DeskEventType, callback: DeskEventCallback<T>) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    this.debug(
      `${DebugPrefix} Listener added for '${event}', total: ${this.eventListeners.get(event)!.size}`
    );

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  public off(event: DeskEventType, callback: DeskEventCallback<T>) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      this.debug(`${DebugPrefix} Listener removed for '${event}', remaining: ${listeners.size}`);
    }
  }

  public removeAllListeners() {
    this.eventListeners.clear();
    this.debug(`${DebugPrefix} All listeners removed`);
  }

  public emit(event: DeskEventType, payload: { id?: string | number; data?: T }) {
    // Use batching for update events (high frequency)
    if (event === 'update') {
      this.eventBatcher.add(event, payload);
    } else {
      // Emit immediately for check-in/check-out/clear (lower frequency, more critical)
      this.eventBatcher.emitImmediate(event, {
        ...payload,
        timestamp: Date.now(),
      });
    }
  }
}

/**
 * Event batching system to prevent event avalanche.
 * Groups multiple events into a single microtask.
 */
export class EventBatcher<T = any> {
  private pendingEvents: Map<
    DeskEventType,
    Array<{ id?: string | number; data?: T; timestamp: number }>
  > = new Map();
  private flushScheduled = false;
  private listeners: Map<DeskEventType, Set<DeskEventCallback<T>>>;

  constructor(listeners: Map<DeskEventType, Set<DeskEventCallback<T>>>) {
    this.listeners = listeners;
  }

  /**
   * Adds an event to the batch queue
   */
  public add(event: DeskEventType, payload: { id?: string | number; data?: T }) {
    if (!this.pendingEvents.has(event)) {
      this.pendingEvents.set(event, []);
    }

    this.pendingEvents.get(event)!.push({
      ...payload,
      timestamp: Date.now(),
    });

    // Schedule flush if not already scheduled
    if (!this.flushScheduled) {
      this.flushScheduled = true;
      nextTick(() => this.flush());
    }
  }

  /**
   * Flushes all pending events
   */
  private flush() {
    this.pendingEvents.forEach((payloads, event) => {
      const listeners = this.listeners.get(event);
      if (!listeners || listeners.size === 0) return;

      // Emit each payload to each listener
      payloads.forEach((payload) => {
        listeners.forEach((callback) => callback(payload));
      });
    });

    // Clear batch
    this.pendingEvents.clear();
    this.flushScheduled = false;
  }

  /**
   * Immediately emits an event without batching
   */
  public emitImmediate(
    event: DeskEventType,
    payload: { id?: string | number; data?: T; timestamp: number }
  ) {
    const listeners = this.listeners.get(event);
    if (!listeners) return;

    listeners.forEach((callback) => callback(payload));
  }
}

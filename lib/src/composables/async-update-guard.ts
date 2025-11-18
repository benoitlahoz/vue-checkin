/**
 * Protects against race conditions in async data updates.
 * Ensures that only the latest async operation's result is applied.
 *
 * Example scenario:
 * 1. User triggers update A (slow API call)
 * 2. User triggers update B (fast API call)
 * 3. B completes first, updates state
 * 4. A completes second → should be IGNORED (stale)
 *
 * Without protection: A would overwrite B's newer data
 * With protection: A is detected as stale and discarded
 */
export class AsyncUpdateGuard {
  private updateCounter = 0;

  /**
   * Start a new async operation and get its token
   */
  startUpdate(): number {
    return ++this.updateCounter;
  }

  /**
   * Check if an update token is still current
   */
  isCurrentUpdate(token: number): boolean {
    return token === this.updateCounter;
  }

  /**
   * Reset counter (useful for cleanup)
   */
  reset(): void {
    this.updateCounter = 0;
  }
}

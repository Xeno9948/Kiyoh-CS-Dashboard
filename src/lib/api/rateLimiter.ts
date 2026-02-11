/**
 * Token Bucket Rate Limiter
 * Ensures we don't exceed 25 API calls per minute across both APIs
 */

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second

  constructor(maxCallsPerMinute: number = 25) {
    this.maxTokens = maxCallsPerMinute;
    this.tokens = maxCallsPerMinute;
    this.lastRefill = Date.now();
    this.refillRate = maxCallsPerMinute / 60; // Convert to per second
  }

  /**
   * Acquire a token for an API call
   * Will wait if no tokens are available
   */
  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Wait for next token
    const waitMs = Math.ceil((1 / this.refillRate) * 1000);
    await this.sleep(waitMs);
    return this.acquire();
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsedSeconds * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current token count (for debugging)
   */
  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

// Singleton instance shared across API clients
export const globalRateLimiter = new RateLimiter(25);

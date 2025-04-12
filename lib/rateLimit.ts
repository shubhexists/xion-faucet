import redis from "./redis";

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  maxLifetimeRequests?: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
  msBeforeNext: number;
  lifetimeRemaining?: number;
  lifetimeLimit?: number;
  lifetimeLimitReached?: boolean;
}

export async function rateLimit(
  userKey: string,
  tokenKey: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const combinedKey = `${userKey}:${tokenKey}`;

  const now = Date.now();
  const window = Math.floor(now / options.windowMs);
  const windowKey = `ratelimit:${combinedKey}:${window}`;
  const lifetimeKey = `ratelimit:lifetime:${combinedKey}`;

  let lifetimeCount = 0;
  let lifetimeLimitReached = false;

  if (options.maxLifetimeRequests) {
    lifetimeCount = await redis
      .get(lifetimeKey)
      .then((val) => parseInt(val || "0", 10));
    lifetimeLimitReached = lifetimeCount >= options.maxLifetimeRequests;

    if (lifetimeLimitReached) {
      return {
        success: false,
        remaining: 0,
        resetAt: new Date(now - (now % options.windowMs) + options.windowMs),
        msBeforeNext: options.windowMs,
        lifetimeRemaining: 0,
        lifetimeLimit: options.maxLifetimeRequests,
        lifetimeLimitReached: true,
      };
    }
  }

  const result = await redis
    .multi()
    .incr(windowKey)
    .expire(windowKey, Math.ceil(options.windowMs / 1000))
    .exec();

  const currentRequests = (result?.[0]?.[1] as number) || 1;
  const timeWindowLimitReached = currentRequests > options.maxRequests;

  if (!timeWindowLimitReached && options.maxLifetimeRequests) {
    await redis.incr(lifetimeKey);
    lifetimeCount++;
  }

  const resetAt = new Date(now - (now % options.windowMs) + options.windowMs);
  const msBeforeNext = resetAt.getTime() - now;

  return {
    success: !timeWindowLimitReached && !lifetimeLimitReached,
    remaining: Math.max(0, options.maxRequests - currentRequests),
    resetAt,
    msBeforeNext,
    lifetimeRemaining: options.maxLifetimeRequests
      ? Math.max(0, options.maxLifetimeRequests - lifetimeCount)
      : undefined,
    lifetimeLimit: options.maxLifetimeRequests,
    lifetimeLimitReached: options.maxLifetimeRequests
      ? lifetimeCount >= options.maxLifetimeRequests
      : false,
  };
}

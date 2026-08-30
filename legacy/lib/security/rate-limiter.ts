/**
 * Rate Limiting Middleware
 * Prevents API abuse and DDoS attacks
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

export const RATE_LIMIT_CONFIGS = {
  // Expensive AI endpoints
  AI_CONVERSATION: { windowMs: 60 * 1000, maxRequests: 20 },  // 20 req/min
  AI_EVALUATION: { windowMs: 60 * 1000, maxRequests: 10 },    // 10 req/min
  AI_TTS: { windowMs: 60 * 1000, maxRequests: 30 },           // 30 req/min

  // Standard endpoints
  SESSIONS: { windowMs: 60 * 1000, maxRequests: 100 },        // 100 req/min
  SCENARIOS: { windowMs: 60 * 1000, maxRequests: 100 },       // 100 req/min
};

/**
 * Check if request is within rate limit
 * @param identifier - Unique identifier (IP address + endpoint)
 * @param config - Rate limit configuration
 * @returns {allowed: boolean, resetTime: number, remaining: number}
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; resetTime: number; remaining: number } {
  const now = Date.now();

  // Get or create rate limit entry
  if (!store[identifier] || store[identifier].resetTime < now) {
    store[identifier] = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  const entry = store[identifier];
  entry.count++;

  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    allowed,
    resetTime: entry.resetTime,
    remaining,
  };
}

/**
 * Get client identifier (IP address)
 * @param request - Next.js request object
 * @returns IP address string
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  return 'unknown';
}

/**
 * Create rate limit error response
 */
export function createRateLimitResponse(resetTime: number) {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      success: false,
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
      },
    }
  );
}

// Rate-Limiting für API-Endpunkte
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-Memory Store für Rate-Limiting (in Produktion: Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number; // Zeitfenster in Millisekunden
  maxRequests: number; // Maximale Anfragen pro Zeitfenster
}

export function rateLimit(config: RateLimitConfig) {
  return (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Neuer Eintrag oder Zeitfenster abgelaufen
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs
      };
      rateLimitStore.set(identifier, newEntry);
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: newEntry.resetTime
      };
    }

    if (entry.count >= config.maxRequests) {
      // Limit erreicht
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    // Anfrage zählen
    entry.count++;
    rateLimitStore.set(identifier, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  };
}

// Standard Rate-Limits
export const RATE_LIMITS = {
  // Login-Endpunkte: 5 Versuche pro 15 Minuten
  LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  
  // TAN-Anfragen: 3 Versuche pro 10 Minuten
  TAN_REQUEST: { windowMs: 10 * 60 * 1000, maxRequests: 3 },
  
  // Allgemeine API: 100 Anfragen pro Minute
  API: { windowMs: 60 * 1000, maxRequests: 100 },
  
  // Stripe-Checkout: 10 Anfragen pro Stunde
  CHECKOUT: { windowMs: 60 * 60 * 1000, maxRequests: 10 }
};

// Rate-Limit-Middleware für Next.js API Routes
export function withRateLimit(config: RateLimitConfig) {
  return function(handler: (request: Request, ...args: unknown[]) => Promise<Response>) {
    return async function(request: Request, ...args: unknown[]) {
      // IP-Adresse oder User-ID als Identifier verwenden
      const identifier = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown';
      
      const rateLimitCheck = rateLimit(config);
      const result = rateLimitCheck(identifier);
      
      if (!result.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
            resetTime: result.resetTime
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
            }
          }
        );
      }
      
      // Rate-Limit-Headers hinzufügen
      const response = await handler(request, ...args);
      
      if (response instanceof Response) {
        response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
      }
      
      return response;
    };
  };
}

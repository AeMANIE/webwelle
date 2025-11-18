// Rate-Limiting für API-Endpunkte
import { getRedisClient, isRedisEnabled, safeRedisOperation, REDIS_KEYS } from './redis';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-Memory Store als Fallback (wenn Redis nicht verfügbar)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number; // Zeitfenster in Millisekunden
  maxRequests: number; // Maximale Anfragen pro Zeitfenster
}

// Rate Limit mit Redis (atomar) oder Fallback zu In-Memory
async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const redis = getRedisClient();
  if (!redis || !isRedisEnabled()) {
    throw new Error('Redis nicht verfügbar');
  }

  const now = Date.now();
  const key = REDIS_KEYS.rateLimit(identifier);
  
  // Atomare Operation: GET, prüfen, inkrementieren und SETEX in einem Transaction
  // Verwende Lua Script für echte Atomizität
  const luaScript = `
    local key = KEYS[1]
    local windowMs = tonumber(ARGV[1])
    local maxRequests = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    
    local data = redis.call('GET', key)
    local count = 1
    local resetTime = now + windowMs
    
    if data then
      local entry = cjson.decode(data)
      if now > entry.resetTime then
        -- Zeitfenster abgelaufen - neu starten
        count = 1
        resetTime = now + windowMs
      else
        -- Bestehendes Zeitfenster verwenden
        count = entry.count + 1
        resetTime = entry.resetTime
      end
    end
    
    local ttl = math.ceil((resetTime - now) / 1000)
    local entry = cjson.encode({count = count, resetTime = resetTime})
    redis.call('SETEX', key, ttl, entry)
    
    local allowed = count <= maxRequests
    local remaining = math.max(0, maxRequests - count)
    
    return cjson.encode({allowed = allowed, remaining = remaining, resetTime = resetTime})
  `;

  try {
    const result = await redis.eval(
      luaScript,
      1, // Anzahl der Keys
      key, // KEYS[1]
      config.windowMs.toString(), // ARGV[1]
      config.maxRequests.toString(), // ARGV[2]
      now.toString() // ARGV[3]
    ) as string;

    const parsed = JSON.parse(result) as { allowed: boolean; remaining: number; resetTime: number };
    return parsed;
  } catch (error) {
    // Fallback: Wenn Lua Script fehlschlägt, verwende einfache GET/SET Logik
    console.warn('⚠️ Redis Lua Script fehlgeschlagen, verwende Fallback-Logik:', error);
    
    const existingData = await redis.get(key);
    let count: number;
    let resetTime: number;

    if (existingData) {
      const entry: RateLimitEntry = JSON.parse(existingData);
      if (now > entry.resetTime) {
        // Zeitfenster abgelaufen - neu starten
        count = 1;
        resetTime = now + config.windowMs;
      } else {
        // Bestehendes Zeitfenster verwenden
        count = entry.count + 1;
        resetTime = entry.resetTime;
      }
    } else {
      // Neuer Eintrag
      count = 1;
      resetTime = now + config.windowMs;
    }

    // Atomar speichern mit SETEX
    const ttl = Math.ceil((resetTime - now) / 1000);
    await redis.setex(key, ttl, JSON.stringify({ count, resetTime }));

    if (count > config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - count,
      resetTime
    };
  }
}

// In-Memory Fallback
function checkRateLimitMemory(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
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
}

export function rateLimit(config: RateLimitConfig) {
  return async (identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
    return safeRedisOperation(
      () => checkRateLimitRedis(identifier, config),
      () => checkRateLimitMemory(identifier, config)
    );
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
      const result = await rateLimitCheck(identifier);
      
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

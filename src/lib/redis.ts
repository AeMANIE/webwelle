import Redis from 'ioredis';

// Redis Connection aus Umgebungsvariable oder Fallback
const getRedisConfig = () => {
  // Redis URL aus Umgebungsvariable (Format: rediss://default:password@host:port/db)
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl) {
    // Parse Redis URL (rediss:// für SSL)
    try {
      const url = new URL(redisUrl);
      
      // Extrahiere Passwort aus URL
      // Bei rediss://default:password@host ist das Passwort nach dem Doppelpunkt im Username
      let password = url.password;
      
      // Wenn kein Passwort in URL.password, prüfe Username (z.B. "default:password")
      if (!password && url.username && url.username.includes(':')) {
        const parts = url.username.split(':');
        if (parts.length > 1) {
          password = parts.slice(1).join(':'); // Alle Teile nach dem ersten ':' als Passwort
        }
      }
      
      // Wenn immer noch kein Passwort, verwende den gesamten Username (falls kein Doppelpunkt)
      if (!password && url.username && url.username !== 'default') {
        password = url.username;
      }
      
      return {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: password || undefined,
        db: parseInt(url.pathname?.slice(1) || '0'),
        // TLS für rediss:// (Redis mit SSL)
        tls: url.protocol === 'rediss:' ? {
          rejectUnauthorized: false // Für selbst-signierte Zertifikate
        } : undefined,
        retryStrategy: (times: number) => {
          // Exponential backoff, max 3 Versuche
          if (times > 3) {
            console.warn('⚠️ Redis Verbindung fehlgeschlagen nach 3 Versuchen. Fallback zu In-Memory.');
            return null; // Kein Retry mehr
          }
          return Math.min(times * 50, 2000);
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
        connectTimeout: 10000, // 10 Sekunden Timeout
      };
    } catch (error) {
      console.error('❌ Fehler beim Parsen der Redis URL:', error);
      return null;
    }
  }
  
  // Fallback: Einzelne Umgebungsvariablen
  if (process.env.REDIS_HOST) {
    return {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      tls: process.env.REDIS_TLS === 'true' ? {
        rejectUnauthorized: false
      } : undefined,
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.warn('⚠️ Redis Verbindung fehlgeschlagen nach 3 Versuchen. Fallback zu In-Memory.');
          return null;
        }
        return Math.min(times * 50, 2000);
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 10000,
    };
  }
  
  return null;
};

// Redis Client erstellen
let redisClient: Redis | null = null;
let redisEnabled = false;

const initializeRedis = () => {
  if (redisClient) return redisClient;

  const config = getRedisConfig();
  
  if (!config) {
    console.warn('⚠️ REDIS_URL nicht gesetzt. Verwende In-Memory Store.');
    return null;
  }

  try {
    redisClient = new Redis(config);
    redisEnabled = true;
    
    // Event Handler
    let connectionAttempts = 0;
    let lastErrorLogged = 0;
    const ERROR_LOG_INTERVAL = 30000; // Nur alle 30 Sekunden einen Fehler loggen
    
    redisClient.on('connect', () => {
      console.log('✅ Redis verbunden');
      connectionAttempts = 0;
      redisEnabled = true;
    });
    
    redisClient.on('error', (error) => {
      connectionAttempts++;
      const now = Date.now();
      
      // Nur loggen wenn:
      // 1. Development Mode ODER
      // 2. Erster Fehler ODER
      // 3. Letzter Fehler-Log war vor mehr als 30 Sekunden
      if (process.env.NODE_ENV === 'development' || connectionAttempts === 1 || (now - lastErrorLogged) > ERROR_LOG_INTERVAL) {
        // Nur ENOTFOUND Fehler nicht in Production loggen (zu viele)
        const isConnectionError = error instanceof Error && error.message.includes('ENOTFOUND');
        if (process.env.NODE_ENV === 'development' || !isConnectionError || connectionAttempts === 1) {
          console.error('❌ Redis Fehler:', error instanceof Error ? error.message : error);
          lastErrorLogged = now;
        }
      }
      redisEnabled = false;
    });
    
    redisClient.on('close', () => {
      // Nur einmal loggen, nicht bei jedem close Event
      if (connectionAttempts <= 1 && process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Redis Verbindung geschlossen');
      }
      redisEnabled = false;
    });

    // Verbindung aufbauen (async, blockiert nicht)
    redisClient.connect().catch((error) => {
      connectionAttempts++;
      // Nur ersten Verbindungsfehler loggen
      if (connectionAttempts === 1) {
        const isConnectionError = error instanceof Error && error.message.includes('ENOTFOUND');
        if (process.env.NODE_ENV === 'development' || !isConnectionError) {
          console.error('❌ Redis Verbindung fehlgeschlagen:', error instanceof Error ? error.message : error);
        } else {
          // In Production: Nur einmal kurz loggen
          console.warn('⚠️ Redis nicht erreichbar. Verwende In-Memory Store.');
        }
      }
      redisEnabled = false;
    });

    return redisClient;
  } catch (error) {
    console.error('❌ Fehler beim Initialisieren von Redis:', error);
    return null;
  }
};

// Singleton Pattern: Redis Client nur einmal erstellen
export const getRedisClient = (): Redis | null => {
  if (!redisClient) {
    redisClient = initializeRedis();
  }
  return redisClient;
};

// Prüfe ob Redis verfügbar ist
export const isRedisEnabled = (): boolean => {
  if (!redisClient) {
    getRedisClient();
  }
  return redisEnabled && redisClient?.status === 'ready';
};

// Helper: Safe Redis Operation mit Fallback
export async function safeRedisOperation<T>(
  operation: (client: Redis) => Promise<T>,
  fallback: () => T
): Promise<T> {
  const client = getRedisClient();
  const enabled = isRedisEnabled();
  
  // Nur in Development detaillierte Logs
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 safeRedisOperation:', { 
      hasClient: !!client, 
      isEnabled: enabled,
      clientStatus: client ? (client as Redis).status : 'kein Client'
    });
  }
  
  if (!client || !enabled) {
    // Nur in Development loggen
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Redis nicht verfügbar, verwende Fallback');
    }
    return fallback();
  }

  try {
    const result = await operation(client);
    // Nur in Development Erfolgs-Log
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Redis Operation erfolgreich');
    }
    return result;
  } catch (error) {
    // Nur in Development oder bei nicht-Verbindungsfehlern loggen
    const isConnectionError = error instanceof Error && error.message.includes('ENOTFOUND');
    if (process.env.NODE_ENV === 'development' || !isConnectionError) {
      console.error('⚠️ Redis Operation fehlgeschlagen, verwende Fallback:', error instanceof Error ? error.message : error);
    }
    return fallback();
  }
}

// Helper: Redis Key Prefix für Namespace
export const REDIS_KEYS = {
  rateLimit: (identifier: string) => `rate_limit:${identifier}`,
  tan: (email: string) => `tan:${email}`,
  adminTan: (email: string) => `admin_tan:${email}`, // Separate Keys für Admin-TAN
  bookingCache: (sessionId: string) => `booking:${sessionId}`,
  bookingsList: () => 'bookings:list',
  customerBookings: (email: string) => `bookings:customer:${email}`,
} as const;


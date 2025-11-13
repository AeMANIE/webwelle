// Gemeinsamer TAN-Store für beide APIs - mit Redis Support
import { getRedisClient, isRedisEnabled, REDIS_KEYS } from './redis';

interface TANEntry {
  tan: string;
  expiresAt: number;
}

// In-Memory Store als Fallback (wenn Redis nicht verfügbar)
const tanStore = new Map<string, TANEntry>();

// TAN in Redis speichern
async function storeTANRedis(redis: ReturnType<typeof getRedisClient>, email: string, tan: string): Promise<void> {
  if (!redis) {
    throw new Error('Redis Client nicht verfügbar');
  }

  // E-Mail normalisieren (toLowerCase)
  const normalizedEmail = email.toLowerCase().trim();
  
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 Minuten
  const key = REDIS_KEYS.tan(normalizedEmail);
  const ttl = Math.ceil((expiresAt - Date.now()) / 1000); // TTL in Sekunden
  
  console.log('💾 Speichere TAN in Redis:', { 
    originalEmail: email, 
    normalizedEmail, 
    key, 
    ttl,
    expiresAt: new Date(expiresAt).toISOString()
  });
  
  await redis.setex(key, ttl, JSON.stringify({ tan, expiresAt }));
  
  // Verifizieren, dass TAN gespeichert wurde
  const verify = await redis.get(key);
  if (!verify) {
    console.error('❌ TAN wurde NICHT in Redis gespeichert!');
    throw new Error('TAN konnte nicht in Redis gespeichert werden');
  }
  
  console.log('✅ TAN erfolgreich in Redis gespeichert');
}

// TAN aus Redis abrufen
async function getTANRedis(redis: ReturnType<typeof getRedisClient>, email: string): Promise<TANEntry | undefined> {
  if (!redis) {
    throw new Error('Redis Client nicht verfügbar');
  }

  // E-Mail normalisieren (toLowerCase)
  const normalizedEmail = email.toLowerCase().trim();
  
  const key = REDIS_KEYS.tan(normalizedEmail);
  
  console.log('🔍 Suche TAN in Redis:', { 
    originalEmail: email, 
    normalizedEmail, 
    key 
  });
  
  const data = await redis.get(key);
  
  if (!data) {
    console.log('❌ Keine TAN in Redis gefunden für:', normalizedEmail);
    return undefined;
  }
  
  const entry = JSON.parse(data) as TANEntry;
  console.log('✅ TAN in Redis gefunden:', { 
    normalizedEmail, 
    expiresAt: new Date(entry.expiresAt).toISOString(),
    isExpired: Date.now() > entry.expiresAt
  });
  
  return entry;
}

// TAN aus Redis löschen
async function deleteTANRedis(redis: ReturnType<typeof getRedisClient>, email: string): Promise<void> {
  if (!redis) {
    throw new Error('Redis Client nicht verfügbar');
  }

  // E-Mail normalisieren (toLowerCase)
  const normalizedEmail = email.toLowerCase().trim();
  
  const key = REDIS_KEYS.tan(normalizedEmail);
  await redis.del(key);
}

// In-Memory Fallback Funktionen
function storeTANMemory(email: string, tan: string): void {
  // E-Mail normalisieren (toLowerCase)
  const normalizedEmail = email.toLowerCase().trim();
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 Minuten
  tanStore.set(normalizedEmail, { tan, expiresAt });
}

function getTANMemory(email: string): TANEntry | undefined {
  // E-Mail normalisieren (toLowerCase)
  const normalizedEmail = email.toLowerCase().trim();
  return tanStore.get(normalizedEmail);
}

function deleteTANMemory(email: string): void {
  // E-Mail normalisieren (toLowerCase)
  const normalizedEmail = email.toLowerCase().trim();
  tanStore.delete(normalizedEmail);
}

// Public API mit Redis Support
export async function storeTAN(email: string, tan: string): Promise<void> {
  console.log('💾 storeTAN aufgerufen für:', email);
  
  // Versuche zuerst Redis
  const client = getRedisClient();
  const enabled = isRedisEnabled();
  
  if (client && enabled) {
    try {
      console.log('✅ Verwende Redis für storeTAN');
      await storeTANRedis(client, email, tan);
      // Auch im In-Memory speichern als Backup
      storeTANMemory(email, tan);
      console.log('✅ TAN in Redis UND In-Memory gespeichert');
      return;
    } catch (error) {
      console.error('⚠️ Redis Speicherung fehlgeschlagen, verwende In-Memory:', error);
    }
  }
  
  // Fallback: In-Memory
  console.log('⚠️ Verwende In-Memory Fallback für storeTAN');
  storeTANMemory(email, tan);
}

export async function getTAN(email: string): Promise<TANEntry | undefined> {
  console.log('🔍 getTAN aufgerufen für:', email);
  
  // Versuche zuerst Redis
  const client = getRedisClient();
  const enabled = isRedisEnabled();
  
  if (client && enabled) {
    try {
      console.log('✅ Verwende Redis für getTAN');
      const redisResult = await getTANRedis(client, email);
      if (redisResult) {
        console.log('✅ TAN in Redis gefunden');
        return redisResult;
      }
      console.log('⚠️ TAN nicht in Redis, prüfe In-Memory');
    } catch (error) {
      console.error('⚠️ Redis Abruf fehlgeschlagen, prüfe In-Memory:', error);
    }
  }
  
  // Fallback: In-Memory
  console.log('⚠️ Verwende In-Memory Fallback für getTAN');
  const memoryResult = getTANMemory(email);
  console.log('🔍 getTAN Ergebnis:', memoryResult ? 'in Memory gefunden' : 'nicht gefunden');
  return memoryResult;
}

export async function deleteTAN(email: string): Promise<void> {
  // Lösche aus beiden Stores
  const client = getRedisClient();
  const enabled = isRedisEnabled();
  
  if (client && enabled) {
    try {
      await deleteTANRedis(client, email);
    } catch (error) {
      console.error('⚠️ Redis Löschung fehlgeschlagen:', error);
    }
  }
  
  // Immer auch aus In-Memory löschen
  deleteTANMemory(email);
}

export async function verifyTAN(email: string, inputTan: string): Promise<{ valid: boolean; message: string }> {
  // E-Mail normalisieren (toLowerCase)
  const normalizedEmail = email.toLowerCase().trim();
  
  console.log('🔐 Verifiziere TAN:', { 
    originalEmail: email, 
    normalizedEmail,
    inputTanLength: inputTan.length
  });
  
  const entry = await getTAN(normalizedEmail);
  
  if (!entry) {
    console.error('❌ Kein TAN-Eintrag gefunden für:', normalizedEmail);
    return { valid: false, message: 'Kein TAN für diese E-Mail gefunden' };
  }
  
  if (Date.now() > entry.expiresAt) {
    console.error('❌ TAN abgelaufen:', { 
      normalizedEmail,
      expiresAt: new Date(entry.expiresAt).toISOString(),
      now: new Date().toISOString()
    });
    await deleteTAN(normalizedEmail);
    return { valid: false, message: 'TAN ist abgelaufen' };
  }
  
  if (entry.tan !== inputTan) {
    console.error('❌ TAN stimmt nicht überein:', { 
      normalizedEmail,
      storedLength: entry.tan.length,
      inputLength: inputTan.length
    });
    return { valid: false, message: 'Ungültiger TAN' };
  }
  
  // TAN nach erfolgreicher Verifizierung löschen (einmalig verwendbar)
  await deleteTAN(normalizedEmail);
  console.log('✅ TAN erfolgreich verifiziert für:', normalizedEmail);
  
  return { valid: true, message: 'TAN erfolgreich verifiziert' };
}

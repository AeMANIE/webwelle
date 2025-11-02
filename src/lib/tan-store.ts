// Gemeinsamer TAN-Store für beide APIs - mit Redis Support
import { getRedisClient, isRedisEnabled, safeRedisOperation, REDIS_KEYS } from './redis';

interface TANEntry {
  tan: string;
  expiresAt: number;
}

// In-Memory Store als Fallback (wenn Redis nicht verfügbar)
const tanStore = new Map<string, TANEntry>();

// TAN in Redis speichern
async function storeTANRedis(email: string, tan: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis || !isRedisEnabled()) {
    throw new Error('Redis nicht verfügbar');
  }

  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 Minuten
  const key = REDIS_KEYS.tan(email);
  const ttl = Math.ceil((expiresAt - Date.now()) / 1000); // TTL in Sekunden
  
  await redis.setex(key, ttl, JSON.stringify({ tan, expiresAt }));
  console.log('✅ TAN in Redis gespeichert:', { email, expiresAt });
}

// TAN aus Redis abrufen
async function getTANRedis(email: string): Promise<TANEntry | undefined> {
  const redis = getRedisClient();
  if (!redis || !isRedisEnabled()) {
    throw new Error('Redis nicht verfügbar');
  }

  const key = REDIS_KEYS.tan(email);
  const data = await redis.get(key);
  
  if (!data) return undefined;
  
  return JSON.parse(data) as TANEntry;
}

// TAN aus Redis löschen
async function deleteTANRedis(email: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis || !isRedisEnabled()) {
    throw new Error('Redis nicht verfügbar');
  }

  const key = REDIS_KEYS.tan(email);
  await redis.del(key);
  console.log('✅ TAN aus Redis gelöscht für:', email);
}

// In-Memory Fallback Funktionen
function storeTANMemory(email: string, tan: string): void {
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 Minuten
  tanStore.set(email, { tan, expiresAt });
  console.log('⚠️ TAN in Memory gespeichert (Redis nicht verfügbar):', { email, expiresAt });
}

function getTANMemory(email: string): TANEntry | undefined {
  return tanStore.get(email);
}

function deleteTANMemory(email: string): void {
  tanStore.delete(email);
  console.log('⚠️ TAN aus Memory gelöscht (Redis nicht verfügbar):', email);
}

// Public API mit Redis Support
export async function storeTAN(email: string, tan: string): Promise<void> {
  await safeRedisOperation(
    () => storeTANRedis(email, tan),
    () => { storeTANMemory(email, tan); }
  );
}

export async function getTAN(email: string): Promise<TANEntry | undefined> {
  return safeRedisOperation(
    () => getTANRedis(email),
    () => getTANMemory(email)
  );
}

export async function deleteTAN(email: string): Promise<void> {
  await safeRedisOperation(
    () => deleteTANRedis(email),
    () => { deleteTANMemory(email); }
  );
}

export async function verifyTAN(email: string, inputTan: string): Promise<{ valid: boolean; message: string }> {
  const entry = await getTAN(email);
  
  if (!entry) {
    return { valid: false, message: 'Kein TAN für diese E-Mail gefunden' };
  }
  
  if (Date.now() > entry.expiresAt) {
    await deleteTAN(email);
    return { valid: false, message: 'TAN ist abgelaufen' };
  }
  
  if (entry.tan !== inputTan) {
    return { valid: false, message: 'Ungültiger TAN' };
  }
  
  // TAN nach erfolgreicher Verifizierung löschen (einmalig verwendbar)
  await deleteTAN(email);
  
  return { valid: true, message: 'TAN erfolgreich verifiziert' };
}

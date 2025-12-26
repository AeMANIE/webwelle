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
  console.log('💾 storeTANMemory: TAN gespeichert für', normalizedEmail, 'im tanStore. Store-Größe:', tanStore.size);
  console.log('💾 Alle Keys im tanStore:', Array.from(tanStore.keys()));
}

function getTANMemory(email: string): TANEntry | undefined {
  // E-Mail normalisieren (toLowerCase)
  const normalizedEmail = email.toLowerCase().trim();
  console.log('🔍 getTANMemory: Suche TAN für', normalizedEmail, 'Store-Größe:', tanStore.size);
  console.log('🔍 Alle Keys im tanStore:', Array.from(tanStore.keys()));
  const result = tanStore.get(normalizedEmail);
  if (result) {
    console.log('✅ getTANMemory: TAN gefunden für', normalizedEmail);
  } else {
    console.log('❌ getTANMemory: KEINE TAN gefunden für', normalizedEmail);
  }
  return result;
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

// ============================================================================
// ADMIN-TAN-FUNKTIONEN (separate Keys für Admin)
// ============================================================================

// Admin-TAN in Redis speichern
async function storeAdminTANRedis(redis: ReturnType<typeof getRedisClient>, email: string, tan: string): Promise<void> {
  if (!redis) {
    throw new Error('Redis Client nicht verfügbar');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 Minuten
  const { REDIS_KEYS } = await import('./redis');
  const key = REDIS_KEYS.adminTan(normalizedEmail);
  const ttl = Math.ceil((expiresAt - Date.now()) / 1000);
  
  console.log('💾 Speichere Admin-TAN in Redis:', { 
    normalizedEmail, 
    key, 
    ttl,
    expiresAt: new Date(expiresAt).toISOString()
  });
  
  await redis.setex(key, ttl, JSON.stringify({ tan, expiresAt }));
}

// Admin-TAN aus Redis abrufen
async function getAdminTANRedis(redis: ReturnType<typeof getRedisClient>, email: string): Promise<TANEntry | undefined> {
  if (!redis) {
    throw new Error('Redis Client nicht verfügbar');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const { REDIS_KEYS } = await import('./redis');
  const key = REDIS_KEYS.adminTan(normalizedEmail);
  
  const data = await redis.get(key);
  if (!data) return undefined;
  
  return JSON.parse(data) as TANEntry;
}

// Admin-TAN aus Redis löschen
async function deleteAdminTANRedis(redis: ReturnType<typeof getRedisClient>, email: string): Promise<void> {
  if (!redis) {
    throw new Error('Redis Client nicht verfügbar');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const { REDIS_KEYS } = await import('./redis');
  const key = REDIS_KEYS.adminTan(normalizedEmail);
  await redis.del(key);
}

// Admin-TAN speichern (Public API)
export async function storeAdminTAN(email: string, tan: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  console.log('💾 storeAdminTAN aufgerufen für:', { originalEmail: email, normalizedEmail, tan });
  
  const client = getRedisClient();
  const enabled = isRedisEnabled();
  
  // IMMER in Memory speichern (als Backup) - WICHTIG: Verwende storeTANMemory, nicht eine separate Admin-Funktion
  storeTANMemory(normalizedEmail, tan);
  console.log('✅ Admin-TAN in Memory gespeichert für:', normalizedEmail);
  
  // Verifizieren, dass TAN in Memory gespeichert wurde
  const verifyMemory = getTANMemory(normalizedEmail);
  if (verifyMemory) {
    console.log('✅ Verifiziert: Admin-TAN ist in Memory vorhanden:', {
      email: normalizedEmail,
      storedTan: verifyMemory.tan,
      expiresAt: new Date(verifyMemory.expiresAt).toISOString()
    });
  } else {
    console.error('❌ FEHLER: Admin-TAN wurde NICHT in Memory gespeichert!');
  }
  
  if (client && enabled) {
    try {
      await storeAdminTANRedis(client, normalizedEmail, tan);
      console.log('✅ Admin-TAN in Redis gespeichert für:', normalizedEmail);
    } catch (error) {
      console.error('⚠️ Redis Speicherung fehlgeschlagen, verwende nur In-Memory:', error);
    }
  } else {
    console.log('⚠️ Redis nicht verfügbar, verwende nur In-Memory');
  }
}

// Admin-TAN abrufen (Public API)
export async function getAdminTAN(email: string): Promise<TANEntry | undefined> {
  const normalizedEmail = email.toLowerCase().trim();
  console.log('🔍 getAdminTAN aufgerufen für:', { originalEmail: email, normalizedEmail });
  
  // ZUERST Memory prüfen (da Admin-TANs dort gespeichert werden)
  const memoryResult = getTANMemory(normalizedEmail);
  if (memoryResult) {
    console.log('✅ Admin-TAN aus Memory gefunden:', {
      email: normalizedEmail,
      tan: memoryResult.tan,
      expiresAt: new Date(memoryResult.expiresAt).toISOString(),
      isExpired: Date.now() > memoryResult.expiresAt
    });
    return memoryResult;
  }
  console.log('⚠️ Keine Admin-TAN in Memory gefunden für:', normalizedEmail);
  
  // Dann Redis prüfen (als Fallback)
  const client = getRedisClient();
  const enabled = isRedisEnabled();
  
  if (client && enabled) {
    try {
      const redisResult = await getAdminTANRedis(client, normalizedEmail);
      if (redisResult) {
        console.log('✅ Admin-TAN aus Redis gefunden');
        // Auch in Memory speichern für zukünftige Abfragen
        storeTANMemory(normalizedEmail, redisResult.tan);
        return redisResult;
      }
      console.log('⚠️ Keine Admin-TAN in Redis gefunden');
    } catch (error) {
      console.error('⚠️ Redis Abruf fehlgeschlagen:', error);
    }
  }
  
  console.log('❌ Keine Admin-TAN gefunden weder in Memory noch in Redis für:', normalizedEmail);
  return undefined;
}

// Admin-TAN löschen (Public API)
export async function deleteAdminTAN(email: string): Promise<void> {
  const client = getRedisClient();
  const enabled = isRedisEnabled();
  
  if (client && enabled) {
    try {
      await deleteAdminTANRedis(client, email);
    } catch (error) {
      console.error('⚠️ Redis Löschung fehlgeschlagen:', error);
    }
  }
  
  deleteTANMemory(email);
}

// Admin-TAN verifizieren (Public API)
// WICHTIG: Diese Funktion löscht die TAN NICHT - das macht der Aufrufer nach erfolgreichem Login
export async function verifyAdminTAN(email: string, inputTan: string, deleteAfterVerify: boolean = false): Promise<{ valid: boolean; message: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  
  console.log('🔐 Verifiziere Admin-TAN:', { 
    normalizedEmail,
    inputTanLength: inputTan.length,
    deleteAfterVerify
  });
  
  const entry = await getAdminTAN(normalizedEmail);
  
  if (!entry) {
    console.log('❌ Kein TAN-Entry gefunden für:', normalizedEmail);
    return { valid: false, message: 'Kein TAN für diese E-Mail gefunden. Bitte fordern Sie eine neue TAN an.' };
  }
  
  console.log('📋 TAN-Entry gefunden:', {
    email: normalizedEmail,
    storedTan: entry.tan,
    inputTan: inputTan,
    expiresAt: new Date(entry.expiresAt).toISOString(),
    now: new Date().toISOString(),
    isExpired: Date.now() > entry.expiresAt
  });
  
  if (Date.now() > entry.expiresAt) {
    if (deleteAfterVerify) {
      await deleteAdminTAN(normalizedEmail);
    }
    return { valid: false, message: 'TAN ist abgelaufen. Bitte fordern Sie eine neue TAN an.' };
  }
  
  // TAN-Vergleich (exakt, case-sensitive)
  const tanMatch = entry.tan === inputTan;
  console.log('🔍 TAN-Vergleich:', {
    storedTan: entry.tan,
    storedLength: entry.tan.length,
    inputTan: inputTan,
    inputLength: inputTan.length,
    match: tanMatch,
    storedType: typeof entry.tan,
    inputType: typeof inputTan
  });

  if (!tanMatch) {
    console.log('❌ TAN stimmt nicht überein:', {
      stored: entry.tan,
      input: inputTan,
      match: false
    });
    return { valid: false, message: 'Ungültiger TAN-Code. Bitte überprüfen Sie die Eingabe.' };
  }
  
  // TAN ist gültig
  if (deleteAfterVerify) {
    await deleteAdminTAN(normalizedEmail);
  }
  console.log('✅ Admin-TAN erfolgreich verifiziert für:', normalizedEmail);
  
  return { valid: true, message: 'TAN erfolgreich verifiziert' };
}

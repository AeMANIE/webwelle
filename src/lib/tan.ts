// TAN-Management für 2FA (vereinfachte Version)
interface TANEntry {
  email: string;
  tan: string;
  expiresAt: number;
  attempts: number;
  used: boolean;
}

// In-Memory Store für TANs (in Produktion: Redis oder Datenbank)
const tanStore = new Map<string, TANEntry>();

// TAN erstellen
export function createTAN(email: string, tan: string): void {
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 Minuten gültig
  
  console.log('TAN erstellen:', { email, tan, expiresAt });
  
  tanStore.set(email, {
    email,
    tan,
    expiresAt,
    attempts: 0,
    used: false
  });
  
  console.log('TAN-Store nach Erstellung:', tanStore.size, 'Einträge');
  
  // Cleanup nach 10 Minuten
  setTimeout(() => {
    console.log('TAN-Cleanup für:', email);
    tanStore.delete(email);
  }, 10 * 60 * 1000);
}

// TAN verifizieren
export function verifyTAN(email: string, inputTan: string): { valid: boolean; message: string } {
  console.log('TAN-Verifizierung:', { email, inputTan, storeSize: tanStore.size });
  console.log('Alle TANs im Store:', Array.from(tanStore.entries()));
  
  const entry = tanStore.get(email);
  console.log('TAN-Entry für', email, ':', entry);
  
  if (!entry) {
    return { valid: false, message: 'Kein TAN für diese E-Mail gefunden' };
  }
  
  if (entry.used) {
    return { valid: false, message: 'TAN wurde bereits verwendet' };
  }
  
  if (Date.now() > entry.expiresAt) {
    console.log('TAN abgelaufen:', { now: Date.now(), expiresAt: entry.expiresAt });
    tanStore.delete(email);
    return { valid: false, message: 'TAN ist abgelaufen' };
  }
  
  if (entry.attempts >= 3) {
    tanStore.delete(email);
    return { valid: false, message: 'Zu viele fehlgeschlagene Versuche' };
  }
  
  console.log('TAN-Vergleich:', { stored: entry.tan, input: inputTan, match: entry.tan === inputTan });
  
  if (entry.tan !== inputTan) {
    entry.attempts++;
    tanStore.set(email, entry);
    return { valid: false, message: 'Ungültiger TAN' };
  }
  
  // TAN als verwendet markieren
  entry.used = true;
  tanStore.set(email, entry);
  
  console.log('TAN erfolgreich verifiziert für:', email);
  return { valid: true, message: 'TAN erfolgreich verifiziert' };
}

// TAN löschen
export function deleteTAN(email: string): void {
  console.log('TAN löschen für:', email);
  tanStore.delete(email);
}

// TAN-Status prüfen
export function getTANStatus(email: string): { exists: boolean; expiresAt?: number; attempts?: number } {
  const entry = tanStore.get(email);
  
  if (!entry) {
    return { exists: false };
  }
  
  return {
    exists: true,
    expiresAt: entry.expiresAt,
    attempts: entry.attempts
  };
}

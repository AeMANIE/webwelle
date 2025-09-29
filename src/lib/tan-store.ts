// Gemeinsamer TAN-Store für beide APIs
interface TANEntry {
  tan: string;
  expiresAt: number;
}

const tanStore = new Map<string, TANEntry>();

export function storeTAN(email: string, tan: string): void {
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 Minuten
  tanStore.set(email, { tan, expiresAt });
  console.log('TAN gespeichert:', { email, tan, expiresAt });
}

export function getTAN(email: string): TANEntry | undefined {
  return tanStore.get(email);
}

export function deleteTAN(email: string): void {
  tanStore.delete(email);
  console.log('TAN gelöscht für:', email);
}

export function verifyTAN(email: string, inputTan: string): { valid: boolean; message: string } {
  const entry = tanStore.get(email);
  
  if (!entry) {
    return { valid: false, message: 'Kein TAN für diese E-Mail gefunden' };
  }
  
  if (Date.now() > entry.expiresAt) {
    tanStore.delete(email);
    return { valid: false, message: 'TAN ist abgelaufen' };
  }
  
  if (entry.tan !== inputTan) {
    return { valid: false, message: 'Ungültiger TAN' };
  }
  
  return { valid: true, message: 'TAN erfolgreich verifiziert' };
}

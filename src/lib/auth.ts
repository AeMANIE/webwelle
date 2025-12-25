import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validatePassword, verifyPassword as verifyPasswordUtil } from './password';
import { logLoginAttempt, logFailedAuth } from './security-logger';

// JWT Secret zur Laufzeit validieren
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET Umgebungsvariable ist nicht gesetzt');
  }
  return secret;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'customer';
  name: string;
}

// Admin-Benutzer (in Produktion aus Datenbank)
export function getAdminUsers() {
  // Prüfe ob Admin-Konfiguration vorhanden ist (nur zur Laufzeit)
  if (!process.env.ADMIN_EMAIL) {
    throw new Error('ADMIN_EMAIL Umgebungsvariable ist nicht gesetzt');
  }

  // Erlaube entweder gehashtes Passwort (ADMIN_PASSWORD_HASH) oder Klartext (ADMIN_PASSWORD)
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const passwordPlain = process.env.ADMIN_PASSWORD;

  if (!passwordHash && !passwordPlain) {
    throw new Error('Entweder ADMIN_PASSWORD_HASH oder ADMIN_PASSWORD muss gesetzt sein');
  }
  
  return [
    {
      id: 'admin-1',
      email: process.env.ADMIN_EMAIL,
      // Speichere, was vorhanden ist. Die Verifizierung erfolgt in adminLogin
      password: (passwordHash || passwordPlain) as string,
      name: 'WebWelle Admin',
      role: 'admin' as const
    }
  ];
}

// Passwort hashen
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Passwort verifizieren
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// JWT Token erstellen
export function createToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      name: user.name 
    },
    getJWTSecret(),
    { expiresIn: '24h' }
  );
}

// JWT Token verifizieren
export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as { id: string; email: string; role: 'admin' | 'customer'; name: string };
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name
    };
  } catch {
    return null;
  }
}

// Admin-Login (NUR Passwort-Validierung - TAN wird separat angefordert)
export async function adminLogin(email: string, password: string): Promise<{ user: User; token: string } | null> {
  const adminUsers = getAdminUsers();
  
  // Case-insensitive E-Mail-Vergleich
  const admin = adminUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!admin) {
    logFailedAuth(`Admin-Login: E-Mail nicht gefunden - ${email}`);
    return null;
  }
  
  let isValid = false;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const passwordPlain = process.env.ADMIN_PASSWORD;

  if (passwordPlain) {
    isValid = password === passwordPlain;
  } else if (passwordHash) {
    isValid = await verifyPassword(password, passwordHash);
  }
  
  if (!isValid) {
    logFailedAuth(`Admin-Login: Ungültiges Passwort - ${email}`);
    return null;
  }
  
  // Passwort ist korrekt - aber KEIN Token zurückgeben!
  // TAN muss zuerst angefordert werden
  return null;
}

// Admin-TAN anfordern (nach erfolgreicher Passwort-Validierung)
export async function adminRequestTAN(email: string, password: string): Promise<{ success: boolean; message: string; tan?: string }> {
  const adminUsers = getAdminUsers();
  const normalizedEmail = email.toLowerCase().trim();
  
  // Admin finden
  const admin = adminUsers.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!admin) {
    return { success: false, message: 'Ungültige E-Mail-Adresse' };
  }
  
  // Passwort validieren
  let isValid = false;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const passwordPlain = process.env.ADMIN_PASSWORD;

  if (passwordPlain) {
    isValid = password === passwordPlain;
  } else if (passwordHash) {
    isValid = await verifyPassword(password, passwordHash);
  }
  
  if (!isValid) {
    logFailedAuth(`Admin-TAN-Anfrage: Ungültiges Passwort - ${email}`);
    return { success: false, message: 'Ungültiges Passwort' };
  }
  
  // TAN generieren und senden
  const { generateTAN } = await import('./email');
  const { storeAdminTAN } = await import('./tan-store');
  const { sendAdminTANEmail } = await import('./email');
  
  const tan = generateTAN();
  
  console.log('🔑 Generiere Admin-TAN für:', { 
    normalizedEmail,
    adminName: admin.name 
  });
  
  // TAN speichern
  try {
    await storeAdminTAN(normalizedEmail, tan);
    console.log('✅ Admin-TAN gespeichert für:', normalizedEmail);
  } catch (storeError) {
    console.error('❌ Fehler beim Speichern der Admin-TAN:', storeError);
    return { success: false, message: 'Fehler beim Speichern der TAN' };
  }
  
  // TAN per E-Mail senden
  const emailSent = await sendAdminTANEmail(normalizedEmail, tan, admin.name || 'Admin');
  if (!emailSent) {
    return { success: false, message: 'Fehler beim Senden der E-Mail' };
  }
  
  console.log('✅ Admin-TAN-E-Mail gesendet an:', normalizedEmail);
  
  // Für Entwicklung: TAN zurückgeben (nur wenn nicht in Produktion)
  return { 
    success: true, 
    message: 'TAN wurde per E-Mail gesendet', 
    tan: process.env.NODE_ENV !== 'production' ? tan : undefined 
  };
}

// Admin-Login mit TAN (2FA)
export async function adminLogin2FA(email: string, tan: string): Promise<{ user: User; token: string } | null> {
  const adminUsers = getAdminUsers();
  const normalizedEmail = email.toLowerCase().trim();
  
  // Admin finden
  const admin = adminUsers.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!admin) {
    logFailedAuth(`Admin-2FA-Login: E-Mail nicht gefunden - ${email}`);
    return null;
  }
  
  // TAN verifizieren und LÖSCHEN (deleteAfterVerify = true)
  const { verifyAdminTAN } = await import('./tan-store');
  const tanValidation = await verifyAdminTAN(normalizedEmail, tan, true); // true = löschen nach Verifizierung
  
  if (!tanValidation.valid) {
    logFailedAuth(`Admin-2FA-Login: Ungültiger TAN - ${email} - ${tanValidation.message}`);
    return null;
  }
  
  // TAN ist gültig - erstelle Token
  const user: User = {
    id: admin.id!,
    email: admin.email!,
    role: admin.role,
    name: admin.name!
  };
  
  const token = createToken(user);
  logLoginAttempt(email, true);
  console.log('✅ Admin 2FA-Login erfolgreich:', user.email);
  return { user, token };
}

// Kunden-Login mit 2FA
export async function customerLogin(email: string, password: string): Promise<{ user: User; token: string } | null> {
  // In Produktion: Kunden aus Datenbank laden
  if (process.env.NODE_ENV === 'production') {
    const { getCustomerByEmail } = await import('./database');
    const customer = await getCustomerByEmail(email);
    
    if (!customer || !customer.password_hash) return null;
    
    // Passwort verifizieren
    const isValidPassword = await verifyPasswordUtil(password, customer.password_hash);
    if (!isValidPassword) return null;
    
    const user: User = {
      id: customer.id!.toString(),
      email: customer.email,
      role: 'customer',
      name: customer.name
    };
    
    const token = createToken(user);
    return { user, token };
  }

  // Für Entwicklung: Hardcoded Test-Kunden
  const CUSTOMER_USERS = [
    {
      id: 'customer-1',
      email: 'customer1@example.com',
      password: '$2b$12$iwy8veYiyMqIplZUukl.n.TRd9PAR/ln4zemFfk4xA6i5sxTWky5O', // "Password123!"
      name: 'Max Mustermann',
      role: 'customer' as const
    },
    {
      id: 'customer-2', 
      email: 'anna@demo-company.de',
      password: '$2b$12$iwy8veYiyMqIplZUukl.n.TRd9PAR/ln4zemFfk4xA6i5sxTWky5O', // "Password123!"
      name: 'Anna Schmidt',
      role: 'customer' as const
    },
    {
      id: 'customer-3',
      email: 'harmonie_556@yahoo.com',
      password: '$2b$12$iwy8veYiyMqIplZUukl.n.TRd9PAR/ln4zemFfk4xA6i5sxTWky5O', // "Password123!"
      name: 'Harmonie Kunde',
      role: 'customer' as const
    }
  ];

  const customer = CUSTOMER_USERS.find(u => u.email === email);
  if (!customer) return null;
  
  // Passwort verifizieren
  const isValidPassword = await verifyPasswordUtil(password, customer.password);
  if (!isValidPassword) return null;
  
  const user: User = {
    id: customer.id,
    email: customer.email,
    role: customer.role,
    name: customer.name
  };
  
  const token = createToken(user);
  return { user, token };
}

// TAN für 2FA anfordern
export async function requestTAN(email: string, password: string): Promise<{ success: boolean; message: string; tan?: string }> {
  // E-Mail normalisieren (toLowerCase)
  const normalizedEmail = email.toLowerCase().trim();
  
  // Kunde aus Datenbank holen
  const { getCustomerByEmail } = await import('@/lib/database');
  const customer = await getCustomerByEmail(normalizedEmail);
  
  if (!customer) {
    return { success: false, message: 'Ungültige E-Mail-Adresse' };
  }
  
  // Prüfe ob Kunde ein Passwort hat
  if (!customer.password_hash) {
    return { success: false, message: 'Konto noch nicht aktiviert. Bitte setzen Sie zuerst ein Passwort.' };
  }
  
  // Passwort validieren
  const isValidPassword = await verifyPasswordUtil(password, customer.password_hash);
  if (!isValidPassword) {
    return { success: false, message: 'Ungültiges Passwort' };
  }
  
  // TAN generieren und senden
  const { generateTAN, sendTANEmail } = await import('@/lib/email');
  const { storeTAN } = await import('@/lib/tan-store');
  
  const tan = generateTAN();
  
  console.log('🔑 Generiere TAN für:', { 
    originalEmail: email, 
    normalizedEmail,
    customerName: customer.name 
  });
  
  // TAN speichern (mit normalisierter E-Mail)
  try {
    await storeTAN(normalizedEmail, tan);
    console.log('✅ TAN gespeichert für:', normalizedEmail);
  } catch (storeError) {
    console.error('❌ Fehler beim Speichern der TAN:', storeError);
    return { success: false, message: 'Fehler beim Speichern der TAN' };
  }
  
  const emailSent = await sendTANEmail(normalizedEmail, tan, customer.name);
  if (!emailSent) {
    return { success: false, message: 'Fehler beim Senden der E-Mail' };
  }
  
  console.log('✅ TAN-E-Mail gesendet an:', normalizedEmail);
  
  // Für Entwicklung: TAN zurückgeben (nur wenn nicht in Produktion)
  return { success: true, message: 'TAN wurde per E-Mail gesendet', tan: process.env.NODE_ENV !== 'production' ? tan : undefined };
}

// TAN für Admin 2FA anfordern
export async function requestAdminTAN(email: string, password: string): Promise<{ success: boolean; message: string; tan?: string }> {
  // E-Mail normalisieren
  const normalizedEmail = email.toLowerCase().trim();
  
  // Admin-Benutzer prüfen
  const adminUsers = getAdminUsers();
  const admin = adminUsers.find(u => u.email.toLowerCase() === normalizedEmail);
  
  if (!admin) {
    return { success: false, message: 'Ungültige E-Mail-Adresse' };
  }
  
  // Passwort validieren
  let isValid = false;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const passwordPlain = process.env.ADMIN_PASSWORD;
  
  if (passwordPlain) {
    isValid = password === passwordPlain;
  } else if (passwordHash) {
    isValid = await verifyPasswordUtil(password, passwordHash);
  }
  
  if (!isValid) {
    return { success: false, message: 'Ungültiges Passwort' };
  }
  
  // TAN generieren und senden
  const { generateTAN, sendAdminTANEmail } = await import('@/lib/email');
  const { storeTAN } = await import('@/lib/tan-store');
  
  const tan = generateTAN();
  
  console.log('🔑 Generiere Admin-TAN für:', { 
    email: normalizedEmail,
    adminName: admin.name 
  });
  
  // TAN speichern
  try {
    await storeTAN(normalizedEmail, tan);
    console.log('✅ Admin-TAN gespeichert für:', normalizedEmail);
  } catch (storeError) {
    console.error('❌ Fehler beim Speichern der Admin-TAN:', storeError);
    return { success: false, message: 'Fehler beim Speichern der TAN' };
  }
  
  const emailSent = await sendAdminTANEmail(normalizedEmail, tan, admin.name || 'Admin');
  if (!emailSent) {
    return { success: false, message: 'Fehler beim Senden der E-Mail' };
  }
  
  console.log('✅ Admin-TAN-E-Mail gesendet an:', normalizedEmail);
  
  // Für Entwicklung: TAN zurückgeben (nur wenn nicht in Produktion)
  return { success: true, message: 'TAN wurde per E-Mail gesendet', tan: process.env.NODE_ENV !== 'production' ? tan : undefined };
}

// 2FA-Login mit TAN für Admin
export async function adminLogin2FA(email: string, _tan: string): Promise<{ user: User; token: string } | null> {
  // E-Mail normalisieren
  const normalizedEmail = email.toLowerCase().trim();
  
  // Admin-Benutzer prüfen
  const adminUsers = getAdminUsers();
  const admin = adminUsers.find(u => u.email.toLowerCase() === normalizedEmail);
  
  if (!admin) {
    return null;
  }
  
  // TAN wurde bereits in der API-Route verifiziert und gelöscht
  // Hier nur noch Admin validieren und Token erstellen
  
  const user: User = {
    id: admin.id!,
    email: admin.email!,
    role: 'admin' as const,
    name: admin.name!
  };
  
  const token = createToken(user);
  logLoginAttempt(normalizedEmail, true);
  console.log('✅ Admin 2FA-Login erfolgreich:', user.email);
  return { user, token };
}

// 2FA-Login mit TAN
// WICHTIG: TAN wurde bereits in der API-Route verifiziert, hier nur noch Kunde prüfen
export async function customerLogin2FA(email: string, _tan: string): Promise<{ user: User; token: string } | null> {
  // E-Mail normalisieren (toLowerCase)
  const normalizedEmail = email.toLowerCase().trim();
  
  // Kunde aus Datenbank holen
  const { getCustomerByEmail } = await import('@/lib/database');
  let customer;
  try {
    customer = await getCustomerByEmail(normalizedEmail);
  } catch {
    return null;
  }
  
  if (!customer) {
    return null;
  }
  
  // Prüfe ob Kunde verifiziert ist (nach Registrierung)
  if (!customer.is_verified) {
    return null;
  }
  
  // Prüfe ob Kunde ein Passwort hat
  if (!customer.password_hash) {
    return null;
  }
  
  // TAN wurde bereits in der API-Route verifiziert und gelöscht
  // Hier nur noch Kunde validieren und Token erstellen
  
  const user: User = {
    id: customer.id?.toString() || '',
    email: customer.email,
    role: 'customer' as const,
    name: customer.name || normalizedEmail.split('@')[0]
  };
  
  const token = createToken(user);
  return { user, token };
}

// Passwort-Validierung für Registrierung
export async function validateCustomerPassword(password: string): Promise<{ isValid: boolean; feedback: string[]; suggestions: string[] }> {
  const validation = await validatePassword(password);
  return {
    isValid: validation.isValid,
    feedback: validation.feedback,
    suggestions: validation.suggestions
  };
}

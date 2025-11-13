import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validatePassword, verifyPassword as verifyPasswordUtil } from './password';
import { generateTAN, sendTANEmail } from './email';
import { verifyTAN, createTAN } from './tan';
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
function getAdminUsers() {
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

// Admin-Login
export async function adminLogin(email: string, password: string): Promise<{ user: User; token: string } | null> {
  const adminUsers = getAdminUsers();
  
  // Debug-Logging
  console.log('🔐 Admin Login Versuch:', {
    email,
    adminEmailFromEnv: process.env.ADMIN_EMAIL,
    adminUsersFound: adminUsers.length,
    adminEmails: adminUsers.map(u => u.email),
  });
  
  // Case-insensitive E-Mail-Vergleich
  const admin = adminUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!admin) {
    console.error('❌ Admin nicht gefunden:', {
      searchedEmail: email,
      availableEmails: adminUsers.map(u => u.email),
    });
    logFailedAuth(`Admin-Login: E-Mail nicht gefunden - ${email}`);
    return null;
  }
  
  console.log('✅ Admin gefunden, verifiziere Passwort...');
  let isValid = false;

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const passwordPlain = process.env.ADMIN_PASSWORD;

  console.log('🔍 Passwort-Verifikation Details:', {
    passwordLength: password.length,
    passwordValue: password,
    passwordPlainSet: !!passwordPlain,
    passwordPlainLength: passwordPlain?.length,
    passwordPlainValue: passwordPlain,
    passwordHashSet: !!passwordHash,
    passwordHashLength: passwordHash?.length,
    directComparison: password === passwordPlain,
  });

  if (passwordPlain) {
    // Klartext-Modus (Fallback, auf Wunsch des Betreibers)
    isValid = password === passwordPlain;
    console.log('🔐 Klartext-Vergleich:', {
      isValid,
      password: password,
      passwordPlain: passwordPlain,
      equal: password === passwordPlain,
    });
  } else if (passwordHash) {
    // Hash-Modus (Standard, sicher)
    isValid = await verifyPassword(password, passwordHash);
    console.log('🔐 Hash-Vergleich:', {
      isValid,
      passwordLength: password.length,
      hashLength: passwordHash.length,
    });
  }
  
  if (!isValid) {
    console.error('❌ Passwort-Verifikation fehlgeschlagen:', {
      passwordReceived: password,
      passwordExpected: passwordPlain || 'HASH',
      passwordMatch: password === passwordPlain,
    });
    logFailedAuth(`Admin-Login: Ungültiges Passwort - ${email}`);
    return null;
  }
  
  console.log('✅ Passwort korrekt, erstelle Token...');
  const user: User = {
    id: admin.id!,
    email: admin.email!,
    role: admin.role,
    name: admin.name!
  };
  
  const token = createToken(user);
  logLoginAttempt(email, true);
  console.log('✅ Admin Login erfolgreich:', user.email);
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
  // Für Entwicklung: Hardcoded Kunden verwenden
  const CUSTOMER_USERS = [
    {
      id: 'customer-1',
      email: 'customer1@example.com',
      password: '$2b$12$iwy8veYiyMqIplZUukl.n.TRd9PAR/ln4zemFfk4xA6i5sxTWky5O',
      name: 'Max Mustermann',
      role: 'customer' as const
    },
    {
      id: 'customer-2',
      email: 'anna@demo-company.de',
      password: '$2b$12$iwy8veYiyMqIplZUukl.n.TRd9PAR/ln4zemFfk4xA6i5sxTWky5O',
      name: 'Anna Schmidt',
      role: 'customer' as const
    },
    {
      id: 'customer-3',
      email: 'harmonie_556@yahoo.com',
      password: '$2b$12$iwy8veYiyMqIplZUukl.n.TRd9PAR/ln4zemFfk4xA6i5sxTWky5O',
      name: 'Harmonie Kunde',
      role: 'customer' as const
    }
  ];

  const customer = CUSTOMER_USERS.find(u => u.email === email);
  if (!customer) {
    return { success: false, message: 'Ungültige E-Mail-Adresse' };
  }
  
  const isValidPassword = await verifyPasswordUtil(password, customer.password);
  if (!isValidPassword) {
    return { success: false, message: 'Ungültiges Passwort' };
  }
  
  // TAN generieren und senden
  const tan = generateTAN();
  createTAN(email, tan);
  
  const emailSent = await sendTANEmail(email, tan, customer.name);
  if (!emailSent) {
    return { success: false, message: 'Fehler beim Senden der E-Mail' };
  }
  
    return { success: true, message: 'TAN wurde per E-Mail gesendet' };
}

// 2FA-Login mit TAN
export async function customerLogin2FA(email: string, tan: string): Promise<{ user: User; token: string } | null> {
  console.log('2FA-Login:', { email, tan });
  
  // Für Entwicklung: Hardcoded Kunden verwenden
  const CUSTOMER_USERS = [
    {
      id: 'customer-1',
      email: 'customer1@example.com',
      name: 'Max Mustermann',
      role: 'customer' as const
    },
    {
      id: 'customer-2', 
      email: 'anna@demo-company.de',
      name: 'Anna Schmidt',
      role: 'customer' as const
    },
    {
      id: 'customer-3',
      email: 'harmonie_556@yahoo.com',
      name: 'Harmonie Kunde',
      role: 'customer' as const
    }
  ];

  const customer = CUSTOMER_USERS.find(u => u.email === email);
  if (!customer) {
    console.log('Kunde nicht gefunden:', email);
    return null;
  }
  
  // TAN gegen Store validieren
  const tanValidation = verifyTAN(email, tan);
  if (!tanValidation.valid) {
    console.log('TAN-Validierung fehlgeschlagen:', tanValidation.message);
    return null;
  }
  
  const user: User = {
    id: customer.id,
    email: customer.email,
    role: customer.role,
    name: customer.name
  };
  
  const token = createToken(user);
  console.log('2FA-Login erfolgreich:', { user, token: token.substring(0, 20) + '...' });
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

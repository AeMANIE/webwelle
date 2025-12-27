// WICHTIG: Setze NODE_TLS_REJECT_UNAUTHORIZED für self-signed certificates
// Dies muss GLOBAL gesetzt werden, BEVOR pg importiert wird
const isDevelopmentEnv = process.env.NODE_ENV !== 'production';
const dbUrlForSSL = isDevelopmentEnv && process.env.DATABASE_PUBLICURL 
  ? process.env.DATABASE_PUBLICURL 
  : process.env.DATABASE_URL;

if (dbUrlForSSL?.includes('sslmode=require') && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('⚠️ NODE_TLS_REJECT_UNAUTHORIZED auf 0 gesetzt für VPS-Datenbank');
}

import { Pool } from 'pg';
import { sanitizeText } from './validation';

// PostgreSQL Verbindung mit SSL-Konfiguration für VPS
const getSSLConfig = () => {
  const isDev = process.env.NODE_ENV !== 'production';
  const dbUrl = (isDev && process.env.DATABASE_PUBLICURL) 
    ? process.env.DATABASE_PUBLICURL 
    : (process.env.DATABASE_URL || '');
  const disableSSL = process.env.DATABASE_DISABLE_SSL === 'true';
  
  // Explizite Deaktivierung
  if (disableSSL) {
    return false;
  }
  
  // Parse URL für SSL-Parameter
  try {
    const url = new URL(dbUrl);
    const sslMode = url.searchParams.get('sslmode');
    
    // Wenn sslmode=disable
    if (sslMode === 'disable') {
      return false;
    }
    
    // Für sslmode=require (VPS-Server): SSL mit self-signed certificates erlauben
    if (sslMode === 'require' || sslMode === 'verify-full' || sslMode === 'prefer') {
      return { 
        rejectUnauthorized: false
      };
    }
  } catch (e) {
    // URL-Parsing fehlgeschlagen
  }
  
  // Für lokale Verbindungen ohne SSL
  if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
    return false;
  }
  
  // Für Remote-Verbindungen (VPS): SSL mit self-signed certificates erlauben
  if (!dbUrl.includes('sslmode=disable')) {
    return { 
      rejectUnauthorized: false
    };
  }
  
  return false;
};

// SSL-Konfiguration für VPS mit sslmode=require
const sslConfig = getSSLConfig();

// Für sslmode=require: Stelle sicher, dass rejectUnauthorized false ist
// WICHTIG: Für VPS mit sslmode=require immer rejectUnauthorized: false setzen

// Hilfsfunktion: Korrigiere DATABASE_URL (entfernt führenden Slash vom database path)
export function correctDatabaseUrl(dbUrl: string | undefined): string {
  if (!dbUrl) {
    throw new Error('DATABASE_URL ist nicht gesetzt');
  }
  
  try {
    const url = new URL(dbUrl);
    // Entferne führenden Slash vom database path
    const database = url.pathname.replace(/^\//, '') || 'postgres';
    
    // IMMER korrigieren: Stelle sicher, dass pathname genau '/' + database ist
    // (ohne doppelte Slashes oder falsche Formatierung)
    const correctPathname = '/' + database;
    
    if (url.pathname !== correctPathname) {
      url.pathname = correctPathname;
      const corrected = url.toString();
      console.log('🔧 DATABASE_URL korrigiert (database path):', {
        originalPathname: url.pathname,
        correctedPathname: correctPathname,
        database: database,
        original: dbUrl.substring(0, 50) + '...',
        corrected: corrected.substring(0, 50) + '...'
      });
      return corrected;
    }
    
    // Auch wenn pathname bereits korrekt aussieht, stelle sicher, dass es wirklich korrekt ist
    // (für den Fall, dass es '/postgres/' mit trailing slash ist)
    if (url.pathname.endsWith('/') && url.pathname !== '/') {
      url.pathname = url.pathname.replace(/\/$/, '');
      const corrected = url.toString();
      console.log('🔧 DATABASE_URL korrigiert (trailing slash entfernt):', {
        original: dbUrl.substring(0, 50) + '...',
        corrected: corrected.substring(0, 50) + '...'
      });
      return corrected;
    }
    
    return dbUrl;
  } catch (e) {
    // URL-Parsing fehlgeschlagen, verwende Original
    console.warn('⚠️ DATABASE_URL konnte nicht geparst werden, verwende Original');
    return dbUrl;
  }
}

// Hilfsfunktion: Hole die beste verfügbare Datenbank-URL
// In Development: Bevorzugt DATABASE_PUBLICURL (für externe Verbindungen wie Mac)
// In Production: Verwendet DATABASE_URL (für VPS interne Verbindungen)
export function getDatabaseUrl(usePublicUrl: boolean = false): string {
  const publicUrl = process.env.DATABASE_PUBLICURL;
  const internalUrl = process.env.DATABASE_URL;
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // In Development: Bevorzuge DATABASE_PUBLICURL wenn vorhanden
  if (isDevelopment && publicUrl) {
    return publicUrl;
  }
  
  // Bei expliziter Anforderung (z.B. bei Hostname-Fehlern)
  if (usePublicUrl && publicUrl) {
    return publicUrl;
  }
  
  // Standard: DATABASE_URL verwenden (für Production oder wenn PUBLICURL nicht gesetzt)
  if (!internalUrl) {
    // Fallback: Wenn DATABASE_URL nicht gesetzt, aber PUBLICURL vorhanden ist
    if (publicUrl) {
      console.warn('⚠️ DATABASE_URL nicht gesetzt, verwende DATABASE_PUBLICURL als Fallback');
      return publicUrl;
    }
    throw new Error('DATABASE_URL ist nicht gesetzt');
  }
  
  return internalUrl;
}

// Hilfsfunktion: Erstelle einen temporären Pool mit korrigierter URL
// usePublicUrl: true = bei Hostname-Fehlern (z.B. Mac), false = bei SSL-Fehlern (z.B. VPS)
export async function createTempPool(
  sslConfig: { rejectUnauthorized: boolean } = { rejectUnauthorized: false },
  usePublicUrl: boolean = false
): Promise<import('pg').Pool> {
  const { Pool } = await import('pg');
  const dbUrl = getDatabaseUrl(usePublicUrl);
  
  const correctedUrl = correctDatabaseUrl(dbUrl);
  const url = new URL(correctedUrl);
  
  // Extrahiere database name (ohne führenden Slash)
  const database = url.pathname.replace(/^\//, '') || 'postgres';
  
  // Passwort: URL.password ist bereits decoded, aber wenn es noch encoded ist, decode es
  // Das kann passieren, wenn das Passwort Sonderzeichen enthält
  let password = url.password;
  try {
    // Versuche zu dekodieren (falls es noch encoded ist)
    // decodeURIComponent ist idempotent - wenn bereits decoded, bleibt es gleich
    password = decodeURIComponent(password);
  } catch {
    // Falls Dekodierung fehlschlägt, verwende Original
    password = url.password;
  }
  
  // Erstelle Pool mit expliziten Parametern, um sicherzustellen, dass database richtig ist
  return new Pool({
    host: url.hostname,
    port: parseInt(url.port || '5432', 10),
    database: database, // Explizit setzen, ohne führenden Slash
    user: url.username,
    password: password, // Verwende dekodiertes Passwort
    ssl: sslConfig,
    connectionTimeoutMillis: 10000,
    // Füge sslmode Parameter hinzu, falls vorhanden
    ...(url.searchParams.get('sslmode') && {
      // sslmode wird über ssl config gehandhabt
    })
  });
}

// Hole die beste verfügbare Datenbank-URL
// In Development: Bevorzugt DATABASE_PUBLICURL
// In Production: Verwendet DATABASE_URL
const selectedDbUrl = isDevelopmentEnv && process.env.DATABASE_PUBLICURL 
  ? process.env.DATABASE_PUBLICURL 
  : process.env.DATABASE_URL;

if (!selectedDbUrl) {
  throw new Error('DATABASE_URL oder DATABASE_PUBLICURL muss gesetzt sein');
}

// Korrigiere DATABASE_URL falls nötig (database path)
const correctedDatabaseUrl = correctDatabaseUrl(selectedDbUrl);

// Parse URL für explizite Parameter
let poolConfig: import('pg').PoolConfig;
try {
  const url = new URL(correctedDatabaseUrl);
  const database = url.pathname.replace(/^\//, '') || 'postgres';
  
  // Passwort: URL.password ist bereits decoded, aber wenn es noch encoded ist, decode es
  let password = url.password;
  try {
    // Versuche zu dekodieren (falls es noch encoded ist)
    password = decodeURIComponent(password);
  } catch {
    // Falls Dekodierung fehlschlägt, verwende Original
    password = url.password;
  }
  
  poolConfig = {
    host: url.hostname,
    port: parseInt(url.port || '5432', 10),
    database: database, // Explizit setzen, ohne führenden Slash
    user: url.username,
    password: password, // Verwende dekodiertes Passwort
    ssl: selectedDbUrl?.includes('sslmode=require') 
      ? { 
          rejectUnauthorized: false
        } 
      : sslConfig,
    // Verbindungs-Timeouts
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20,
  };
  
  console.log('🔧 Pool konfiguriert mit expliziten Parametern:', {
    host: poolConfig.host,
    port: poolConfig.port,
    database: poolConfig.database,
    user: poolConfig.user,
    hasPassword: !!poolConfig.password,
    passwordLength: poolConfig.password?.length || 0,
    sslEnabled: !!poolConfig.ssl
  });
} catch (urlError) {
  // Fallback: Verwende connectionString
  console.warn('⚠️ URL-Parsing für Pool fehlgeschlagen, verwende connectionString:', urlError);
  poolConfig = {
    connectionString: correctedDatabaseUrl,
    ssl: selectedDbUrl?.includes('sslmode=require') 
      ? { 
          rejectUnauthorized: false
        } 
      : sslConfig,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20,
  };
}

export const pool = new Pool(poolConfig);

// Input-Sanitization für Datenbank-Eingaben
function sanitizeBookingData(bookingData: BookingData): BookingData {
  return {
    ...bookingData,
    session_id: sanitizeText(bookingData.session_id),
    customer_name: bookingData.customer_name ? sanitizeText(bookingData.customer_name) : undefined,
    customer_email: bookingData.customer_email ? sanitizeText(bookingData.customer_email) : undefined,
    customer_phone: bookingData.customer_phone ? sanitizeText(bookingData.customer_phone) : undefined,
    company_name: bookingData.company_name ? sanitizeText(bookingData.company_name) : undefined,
    design_style: bookingData.design_style ? sanitizeText(bookingData.design_style) : undefined,
    message: bookingData.message ? sanitizeText(bookingData.message) : undefined,
    stripe_customer_id: bookingData.stripe_customer_id ? sanitizeText(bookingData.stripe_customer_id) : undefined,
    stripe_payment_intent_id: bookingData.stripe_payment_intent_id ? sanitizeText(bookingData.stripe_payment_intent_id) : undefined,
    stripe_subscription_id: bookingData.stripe_subscription_id ? sanitizeText(bookingData.stripe_subscription_id) : undefined,
    stripe_invoice_id: bookingData.stripe_invoice_id ? sanitizeText(bookingData.stripe_invoice_id) : undefined,
    // Arrays sanitizen
    target_group: bookingData.target_group?.map(item => sanitizeText(item)) || [],
  };
}

// Datenbank-Schema für Buchungen (angepasst an webwelle_bookings)
export interface BookingData {
  id?: string; // UUID statt number
  session_id: string;
  package_type: 'starterwelle' | 'businesswelle' | 'erfolgswelle' | 'flowwelle' | 'powerwelle' | 'meisterwelle' | 'minijob' | 'midijob' | 'festangestellt' | 'einrichtungspaket';
  is_monthly: boolean;
  checkout_mode: 'payment' | 'subscription';
  package_price_display: string;
  currency: string;
  total_amount_cents: number;
  customer_id?: string; // Foreign Key zu customers (optional)
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  company_name?: string;
  existing_website?: boolean;
  existing_website_url?: string;
  target_group?: string[];
  design_style?: string;
  design_reference_url?: string;
  selected_addons?: Array<{
    key: string;
    billing: 'oneTime' | 'monthly';
    priceId: string;
    amountCents: number;
  }>;
  message?: string;
  raw_form_data?: Record<string, unknown>;
  stripe_metadata?: Record<string, unknown>;
  stripe_customer_id?: string;
  stripe_payment_intent_id?: string;
  stripe_subscription_id?: string;
  stripe_invoice_id?: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  created_at?: Date;
}

// Buchung in Datenbank speichern (webwelle_bookings)
export async function saveBooking(bookingData: BookingData): Promise<BookingData> {
  const client = await pool.connect();
  
  try {
    // Daten sanitizen vor dem Speichern
    const sanitizedData = sanitizeBookingData(bookingData);
    
    const query = `
      INSERT INTO webwelle_bookings (
        session_id, package_type, is_monthly, checkout_mode, package_price_display,
        currency, total_amount_cents, customer_id, customer_name, customer_email, customer_phone,
        company_name, existing_website, existing_website_url, target_group,
        design_style, design_reference_url, selected_addons, message,
        raw_form_data, stripe_metadata, stripe_customer_id, stripe_payment_intent_id,
        stripe_subscription_id, stripe_invoice_id, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
      ) RETURNING *
    `;
    
    const values = [
      sanitizedData.session_id,
      sanitizedData.package_type,
      sanitizedData.is_monthly,
      sanitizedData.checkout_mode || 'payment',
      sanitizedData.package_price_display || 'Preis nicht angegeben',
      sanitizedData.currency || 'eur',
      sanitizedData.total_amount_cents || 0,
      sanitizedData.customer_id || null,
      sanitizedData.customer_name || null,
      sanitizedData.customer_email || null,
      sanitizedData.customer_phone || null,
      sanitizedData.company_name || null,
      sanitizedData.existing_website || null,
      sanitizedData.existing_website_url || null,
      sanitizedData.target_group ? JSON.stringify(sanitizedData.target_group) : null,
      sanitizedData.design_style || null,
      sanitizedData.design_reference_url || null,
      sanitizedData.selected_addons ? JSON.stringify(sanitizedData.selected_addons) : null,
      sanitizedData.message || null,
      sanitizedData.raw_form_data ? JSON.stringify(sanitizedData.raw_form_data) : null,
      sanitizedData.stripe_metadata ? JSON.stringify(sanitizedData.stripe_metadata) : null,
      sanitizedData.stripe_customer_id || null,
      sanitizedData.stripe_payment_intent_id || null,
      sanitizedData.stripe_subscription_id || null,
      sanitizedData.stripe_invoice_id || null,
      sanitizedData.status
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
}

// Buchung nach Session ID abrufen
export async function getBookingBySessionId(sessionId: string): Promise<BookingData | null> {
  const client = await pool.connect();
  
  try {
    const query = 'SELECT * FROM webwelle_bookings WHERE session_id = $1';
    const result = await client.query(query, [sessionId]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

// Buchung Status aktualisieren
export async function updateBookingStatus(sessionId: string, status: string, stripeData?: { customer_id?: string; payment_intent_id?: string }): Promise<void> {
  const client = await pool.connect();
  
  try {
    let query = 'UPDATE webwelle_bookings SET status = $1';
    const values: unknown[] = [status];
    
    if (stripeData?.customer_id) {
      query += ', stripe_customer_id = $' + (values.length + 1);
      values.push(stripeData.customer_id);
    }
    
    if (stripeData?.payment_intent_id) {
      query += ', stripe_payment_intent_id = $' + (values.length + 1);
      values.push(stripeData.payment_intent_id);
    }
    
    query += ' WHERE session_id = $' + (values.length + 1);
    values.push(sessionId);
    
    await client.query(query, values);
  } finally {
    client.release();
  }
}

// Alle Buchungen abrufen
export async function getAllBookings(): Promise<BookingData[]> {
  const client = await pool.connect();
  
  try {
    const query = 'SELECT * FROM webwelle_bookings ORDER BY created_at DESC';
    const result = await client.query(query);
    return result.rows;
  } finally {
    client.release();
  }
}

// Buchungen nach E-Mail abrufen (für Kundenportal)
// Unterstützt beide Wege: customer_id (wenn registriert) oder customer_email (wenn über Stripe gebucht)
export async function getBookingsByEmail(email: string): Promise<BookingData[]> {
  let client;
  let connectionError: Error | null = null;
  
  try {
    client = await pool.connect();
    // Versuche zuerst mit customer_id (wenn Kunde registriert ist)
    const customer = await getCustomerByEmail(email);
    if (customer?.id) {
      const query = `
        SELECT * FROM webwelle_bookings 
        WHERE customer_id = $1 OR customer_email = $2 
        ORDER BY created_at DESC
      `;
      const result = await client.query(query, [customer.id, email]);
      client.release();
      return result.rows;
    }
    
    // Fallback: Nur customer_email
    const query = 'SELECT * FROM webwelle_bookings WHERE customer_email = $1 ORDER BY created_at DESC';
    const result = await client.query(query, [email]);
    client.release();
    return result.rows;
  } catch (error) {
    if (client) client.release();
    connectionError = error instanceof Error ? error : new Error('Unbekannter Fehler');
    
    // SSL-Fallback für VPS
    if (connectionError.message.includes('certificate') || 
        connectionError.message.includes('SSL') || 
        connectionError.message.includes('TLS') ||
        connectionError.message.includes('unable to verify')) {
      const tempPool = await createTempPool({ rejectUnauthorized: false });
      
      try {
        client = await tempPool.connect();
        const customer = await getCustomerByEmail(email);
        if (customer?.id) {
          const query = `
            SELECT * FROM webwelle_bookings 
            WHERE customer_id = $1 OR customer_email = $2 
            ORDER BY created_at DESC
          `;
          const result = await client.query(query, [customer.id, email]);
          client.release();
          await tempPool.end();
          return result.rows;
        }
        
        const query = 'SELECT * FROM webwelle_bookings WHERE customer_email = $1 ORDER BY created_at DESC';
        const result = await client.query(query, [email]);
        client.release();
        await tempPool.end();
        return result.rows;
      } catch (fallbackError) {
        if (client) client.release();
        await tempPool.end();
        throw fallbackError;
      }
    }
    throw connectionError;
  }
}

// Kunden-Schema (für bestehende customers Tabelle)
export interface CustomerData {
  id?: string | number;
  email: string;
  password_hash?: string;
  name: string;
  phone?: string;
  company_name?: string;
  customer_number?: string; // Eindeutige Kundennummer (WEB-YYYY-NNNNN)
  // Adressfelder
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
  // Verifikation & Portal
  is_verified: boolean;
  verification_token?: string;
  reset_token?: string;
  reset_token_expires?: Date;
  portal_activated?: boolean;
  portal_activated_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

// Kunde nach E-Mail abrufen (mit SSL-Fallback)
export async function getCustomerByEmail(email: string): Promise<CustomerData | null> {
  // E-Mail normalisieren (toLowerCase für konsistente Abfrage)
  const normalizedEmail = email.toLowerCase().trim();
  
  let client;
  try {
    client = await pool.connect();
  } catch (connectionError) {
    // Bei SSL-Fehler: Erstelle temporären Pool
    const errorMsg = connectionError instanceof Error ? connectionError.message : '';
    if (errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || errorMsg.includes('unable to verify')) {
      const tempPool = await createTempPool({ rejectUnauthorized: false });
      client = await tempPool.connect();
      
      try {
        const query = 'SELECT * FROM customers WHERE LOWER(email) = LOWER($1)';
        const result = await client.query(query, [normalizedEmail]);
        client.release();
        await tempPool.end();
        return result.rows[0] || null;
      } catch (error) {
        if (client) client.release();
        await tempPool.end();
        throw error;
      }
    }
    throw connectionError;
  }
  
  try {
    // Verwende LOWER() für case-insensitive Suche
    const query = 'SELECT * FROM customers WHERE LOWER(email) = LOWER($1)';
    const result = await client.query(query, [normalizedEmail]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

// Kundennummer generieren (Format: WEB-YYYY-NNNNN) - mit SSL-Fallback
export async function generateCustomerNumber(): Promise<string> {
  let client;
  try {
    client = await pool.connect();
  } catch (connectionError) {
    // Bei SSL-Fehler: Erstelle temporären Pool
    const errorMsg = connectionError instanceof Error ? connectionError.message : '';
    if (errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || errorMsg.includes('unable to verify')) {
      const tempPool = await createTempPool({ rejectUnauthorized: false });
      client = await tempPool.connect();
      
      try {
        const year = new Date().getFullYear();
        const prefix = `WEB-${year}-`;
        
        const result = await client.query(
          `SELECT customer_number FROM customers 
           WHERE customer_number LIKE $1 
           ORDER BY customer_number DESC 
           LIMIT 1`,
          [`${prefix}%`]
        );
        
        let nextNumber = 1;
        if (result.rows.length > 0) {
          const lastNumber = result.rows[0].customer_number;
          if (lastNumber) {
            const match = lastNumber.match(/\d+$/);
            if (match) {
              nextNumber = parseInt(match[0], 10) + 1;
            }
          }
        }
        
        const formattedNumber = `${prefix}${nextNumber.toString().padStart(5, '0')}`;
        client.release();
        await tempPool.end();
        return formattedNumber;
      } catch (error) {
        if (client) client.release();
        await tempPool.end();
        throw error;
      }
    }
    throw connectionError;
  }
  
  try {
    const year = new Date().getFullYear();
    const prefix = `WEB-${year}-`;
    
    // Finde die höchste Nummer für das aktuelle Jahr
    const result = await client.query(
      `SELECT customer_number FROM customers 
       WHERE customer_number LIKE $1 
       ORDER BY customer_number DESC 
       LIMIT 1`,
      [`${prefix}%`]
    );
    
    let nextNumber = 1;
    if (result.rows.length > 0) {
      const lastNumber = result.rows[0].customer_number;
      if (lastNumber) {
        const match = lastNumber.match(/\d+$/);
        if (match) {
          nextNumber = parseInt(match[0], 10) + 1;
        }
      }
    }
    
    // Format: WEB-YYYY-00001
    const formattedNumber = `${prefix}${nextNumber.toString().padStart(5, '0')}`;
    return formattedNumber;
  } finally {
    client.release();
  }
}

// Kunde mit automatischer Kundennummer erstellen oder zurückgeben
export async function getOrCreateCustomerWithNumber(
  email: string,
  name: string,
  phone?: string,
  companyName?: string
): Promise<CustomerData> {
  const client = await pool.connect();
  
  try {
    // Prüfe ob Kunde bereits existiert
    const customer = await getCustomerByEmail(email);
    
    if (customer) {
      // Wenn Kunde existiert aber keine Kundennummer hat, generiere eine
      if (!customer.customer_number) {
        const customerNumber = await generateCustomerNumber();
        await client.query(
          'UPDATE customers SET customer_number = $1 WHERE email = $2',
          [customerNumber, email]
        );
        const updatedCustomer = await getCustomerByEmail(email);
        if (updatedCustomer) {
          return updatedCustomer;
        }
      }
      return customer;
    }
    
    // Neuer Kunde - generiere Kundennummer
    const customerNumber = await generateCustomerNumber();
    
    const query = `
      INSERT INTO customers (
        email, name, phone, company_name, is_verified,
        customer_number, portal_activated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      email,
      name,
      phone || null,
      companyName || null,
      true, // is_verified
      customerNumber,
      false // portal_activated
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
}

// Kunde erstellen (NEUER ANSATZ: Versuche zuerst ohne SSL, dann mit SSL)
export async function createCustomer(customerData: Omit<CustomerData, 'id' | 'created_at' | 'updated_at'>): Promise<CustomerData> {
  // Generiere Kundennummer, wenn nicht vorhanden
  let customerNumber = customerData.customer_number;
  if (!customerNumber) {
    try {
      customerNumber = await generateCustomerNumber();
    } catch (error) {
      // Wenn Kundennummer-Generierung fehlschlägt, weiter ohne
      console.warn('Kundennummer konnte nicht generiert werden:', error);
    }
  }
  
  const { Pool } = await import('pg');
  let client;
  let tempPool: import('pg').Pool | null = null;
  
  // Verwende die zentrale Funktion für korrigierte URL
  try {
    console.log('🔌 Versuche Verbindung mit SSL (rejectUnauthorized: false)...');
    tempPool = await createTempPool({ rejectUnauthorized: false });
    client = await tempPool.connect();
    console.log('✅ Verbindung erfolgreich');
  } catch (sslError) {
    console.error('❌ Verbindungsversuch fehlgeschlagen:', sslError instanceof Error ? sslError.message : 'Unbekannt');
    
    // Letzter Versuch: Setze NODE_TLS_REJECT_UNAUTHORIZED temporär auf 0
    const originalReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    try {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      console.log('🔄 Versuche mit NODE_TLS_REJECT_UNAUTHORIZED=0...');
      tempPool = await createTempPool({ rejectUnauthorized: false });
      client = await tempPool.connect();
      console.log('✅ Verbindung mit NODE_TLS_REJECT_UNAUTHORIZED=0 erfolgreich');
    } catch (lastError) {
      // Stelle Original-Wert wieder her
      if (originalReject !== undefined) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalReject;
      } else {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      }
      console.error('❌ Alle Verbindungsversuche fehlgeschlagen');
      if (tempPool) await tempPool.end();
      throw new Error(`Datenbank-Verbindung fehlgeschlagen: ${lastError instanceof Error ? lastError.message : 'Unbekannter Fehler'}`);
    }
  }
  
  try {
    console.log('📋 Prüfe ob customers Tabelle existiert...');
    // Prüfe zuerst ob Tabelle existiert
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
      ) as exists;
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('❌ customers Tabelle existiert nicht');
      throw new Error('customers Tabelle existiert nicht in der Datenbank');
    }
    console.log('✅ customers Tabelle existiert');
    
    console.log('💾 Erstelle Kunde in Datenbank...');
    const query = `
      INSERT INTO customers (
        email, password_hash, name, phone, company_name, is_verified,
        verification_token, reset_token, reset_token_expires,
        portal_activated, portal_activated_at, customer_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      customerData.email,
      customerData.password_hash || null,
      customerData.name,
      customerData.phone || null,
      customerData.company_name || null,
      customerData.is_verified,
      customerData.verification_token || null,
      customerData.reset_token || null,
      customerData.reset_token_expires || null,
      customerData.portal_activated || false,
      customerData.portal_activated_at || null,
      customerNumber || null
    ];
    
    const result = await client.query(query, values);
    console.log('✅ Kunde erfolgreich erstellt:', result.rows[0]?.email);
    return result.rows[0];
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
    console.error('❌ Query-Fehler in createCustomer:', errorMsg);
    throw error;
  } finally {
    if (client) client.release();
    if (tempPool) await tempPool.end();
  }
}

// Kunde aktualisieren
export async function updateCustomer(email: string, updates: Partial<CustomerData>): Promise<CustomerData | null> {
  const client = await pool.connect();
  
  try {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (updates.password_hash) {
      fields.push(`password_hash = $${paramCount++}`);
      values.push(updates.password_hash);
    }
    
    if (updates.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    
    if (updates.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(updates.phone);
    }
    
    if (updates.company_name !== undefined) {
      fields.push(`company_name = $${paramCount++}`);
      values.push(updates.company_name);
    }
    
    if (updates.is_verified !== undefined) {
      fields.push(`is_verified = $${paramCount++}`);
      values.push(updates.is_verified);
    }
    
    if (updates.verification_token !== undefined) {
      fields.push(`verification_token = $${paramCount++}`);
      values.push(updates.verification_token);
    }
    
    if (updates.reset_token !== undefined) {
      fields.push(`reset_token = $${paramCount++}`);
      values.push(updates.reset_token);
    }
    
    if (updates.reset_token_expires !== undefined) {
      fields.push(`reset_token_expires = $${paramCount++}`);
      values.push(updates.reset_token_expires);
    }
    
    if (updates.portal_activated !== undefined) {
      fields.push(`portal_activated = $${paramCount++}`);
      values.push(updates.portal_activated);
    }
    
    if (updates.portal_activated_at !== undefined) {
      fields.push(`portal_activated_at = $${paramCount++}`);
      values.push(updates.portal_activated_at);
    }
    
    if (updates.customer_number !== undefined) {
      fields.push(`customer_number = $${paramCount++}`);
      values.push(updates.customer_number);
    }
    
    if (fields.length === 0) {
      return null;
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(email);
    
    const query = `
      UPDATE customers 
      SET ${fields.join(', ')} 
      WHERE email = $${paramCount}
      RETURNING *
    `;
    
    const result = await client.query(query, values);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

// Reset-Token-Schema
export interface ResetTokenData {
  id?: number;
  customer_id?: string | number; // Für Admin-Reset aus customers Tabelle
  email: string;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at?: Date;
}

// Reset-Token erstellen
export async function createResetToken(email: string, token: string, expiresAt: Date): Promise<ResetTokenData> {
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO reset_tokens (email, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await client.query(query, [email, token, expiresAt]);
    return result.rows[0];
  } finally {
    client.release();
  }
}

// Reset-Token validieren
// Prüft sowohl reset_tokens Tabelle als auch customers.reset_token (für Admin-Reset)
export async function validateResetToken(token: string): Promise<ResetTokenData | null> {
  const client = await pool.connect();
  
  try {
    // Zuerst in reset_tokens Tabelle suchen (normale Passwort-Reset-Flows)
    const resetTokensQuery = `
      SELECT * FROM reset_tokens 
      WHERE token = $1 AND expires_at > NOW() AND used = false
    `;
    const resetTokensResult = await client.query(resetTokensQuery, [token]);
    
    if (resetTokensResult.rows.length > 0) {
      return resetTokensResult.rows[0];
    }
    
    // Falls nicht gefunden, in customers.reset_token suchen (Admin-initiiert)
    const customersQuery = `
      SELECT 
        id as customer_id,
        email,
        reset_token as token,
        reset_token_expires as expires_at,
        false as used
      FROM customers 
      WHERE reset_token = $1 
        AND reset_token_expires > NOW()
        AND reset_token IS NOT NULL
    `;
    const customersResult = await client.query(customersQuery, [token]);
    
    if (customersResult.rows.length > 0) {
      const row = customersResult.rows[0];
      return {
        customer_id: row.customer_id,
        email: row.email,
        token: row.token,
        expires_at: row.expires_at,
        used: false
      };
    }
    
    return null;
  } finally {
    client.release();
  }
}

// Reset-Token als verwendet markieren
// Markiert Token sowohl in reset_tokens Tabelle als auch in customers.reset_token
export async function markResetTokenAsUsed(token: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    // In reset_tokens Tabelle markieren
    await client.query('UPDATE reset_tokens SET used = true WHERE token = $1', [token]);
    
    // In customers Tabelle markieren (Admin-Reset)
    await client.query(
      `UPDATE customers 
       SET reset_token = NULL, reset_token_expires = NULL 
       WHERE reset_token = $1`,
      [token]
    );
  } finally {
    client.release();
  }
}

// Datenbank-Tabellen erstellen (Vollständige Migration - erstellt ALLE Tabellen)
export async function createTables(): Promise<void> {
  const client = await pool.connect();
  
  try {
    // =====================================================
    // 1. CUSTOMERS TABELLE (muss zuerst erstellt werden)
    // =====================================================
    const createCustomersTableQuery = `
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255),
        phone VARCHAR(50),
        company_name VARCHAR(255),
        customer_number VARCHAR(50) UNIQUE,
        street VARCHAR(255),
        city VARCHAR(255),
        zip VARCHAR(20),
        country VARCHAR(100),
        is_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        portal_activated BOOLEAN DEFAULT false,
        portal_activated_at TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
      CREATE INDEX IF NOT EXISTS idx_customers_portal_activated ON customers(portal_activated);
    `;
    
    // Passwort-Reset-Tokens-Tabelle (falls noch nicht vorhanden)
    const createResetTokensTableQuery = `
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id SERIAL PRIMARY KEY,
        customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_reset_tokens_customer_id ON reset_tokens(customer_id);
      CREATE INDEX IF NOT EXISTS idx_reset_tokens_email ON reset_tokens(email);
      CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON reset_tokens(token);
    `;
    
    // Customer Portal Tokens Tabelle (für Portal-Aktivierung)
    const createPortalTokensTableQuery = `
      CREATE TABLE IF NOT EXISTS customer_portal_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
        customer_email VARCHAR(255) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        booking_id UUID REFERENCES webwelle_bookings(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_portal_tokens_customer_id ON customer_portal_tokens(customer_id);
      CREATE INDEX IF NOT EXISTS idx_portal_tokens_email ON customer_portal_tokens(customer_email);
      CREATE INDEX IF NOT EXISTS idx_portal_tokens_token ON customer_portal_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_portal_tokens_expires ON customer_portal_tokens(expires_at);
    `;
    
    // Erweitere customers Tabelle um Portal-Felder, Kundennummer und Adressfelder (falls noch nicht vorhanden)
    const alterCustomersTableQuery = `
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS portal_activated BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS portal_activated_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS customer_number VARCHAR(50) UNIQUE,
      ADD COLUMN IF NOT EXISTS street VARCHAR(255),
      ADD COLUMN IF NOT EXISTS city VARCHAR(255),
      ADD COLUMN IF NOT EXISTS zip VARCHAR(20),
      ADD COLUMN IF NOT EXISTS country VARCHAR(100);
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
      CREATE INDEX IF NOT EXISTS idx_customers_portal_activated ON customers(portal_activated);
    `;
    
    // =====================================================
    // 2. HAUPTBUCHUNGEN TABELLE (webwelle_bookings)
    // =====================================================
    const createBookingsTableQuery = `
      CREATE TABLE IF NOT EXISTS webwelle_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' 
          CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
        session_id VARCHAR(255) NOT NULL UNIQUE,
        package_type VARCHAR(20) NOT NULL 
          CHECK (package_type IN ('starterwelle', 'businesswelle', 'erfolgswelle', 'flowwelle', 'powerwelle', 'meisterwelle', 'minijob', 'midijob', 'festangestellt', 'einrichtungspaket')),
        is_monthly BOOLEAN NOT NULL,
        checkout_mode VARCHAR(20) NOT NULL 
          CHECK (checkout_mode IN ('payment', 'subscription')),
        package_price_display VARCHAR(100) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'eur',
        total_amount_cents INTEGER NOT NULL CHECK (total_amount_cents > 0),
        customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        company_name VARCHAR(255),
        existing_website BOOLEAN,
        existing_website_url TEXT,
        target_group JSONB,
        design_style VARCHAR(20) 
          CHECK (design_style IN ('modern', 'creative', 'professional', 'tech')),
        design_reference_url TEXT,
        selected_addons JSONB,
        message TEXT,
        raw_form_data JSONB,
        stripe_metadata JSONB,
        stripe_customer_id VARCHAR(255),
        stripe_payment_intent_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        stripe_invoice_id VARCHAR(255)
      );
      CREATE INDEX IF NOT EXISTS idx_bookings_status_created_at ON webwelle_bookings(status, created_at);
      CREATE INDEX IF NOT EXISTS idx_bookings_session_id ON webwelle_bookings(session_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON webwelle_bookings(customer_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON webwelle_bookings(customer_email);
      CREATE INDEX IF NOT EXISTS idx_bookings_package_type ON webwelle_bookings(package_type);
      CREATE INDEX IF NOT EXISTS idx_bookings_stripe_customer_id ON webwelle_bookings(stripe_customer_id);
    `;

    // =====================================================
    // 3. RECHNUNGEN TABELLE (webwelle_invoices)
    // =====================================================
    const createWebwelleInvoicesTableQuery = `
      CREATE TABLE IF NOT EXISTS webwelle_invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        booking_id UUID NOT NULL REFERENCES webwelle_bookings(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        invoice_number VARCHAR(50) NOT NULL UNIQUE,
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        currency VARCHAR(3) NOT NULL DEFAULT 'eur',
        status VARCHAR(20) NOT NULL DEFAULT 'draft' 
          CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
        due_date DATE NOT NULL,
        paid_at TIMESTAMP WITH TIME ZONE,
        stripe_invoice_id VARCHAR(255),
        pdf_url TEXT,
        notes TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON webwelle_invoices(booking_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON webwelle_invoices(invoice_number);
      CREATE INDEX IF NOT EXISTS idx_invoices_status_due_date ON webwelle_invoices(status, due_date);
      CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON webwelle_invoices(stripe_invoice_id);
    `;

    // =====================================================
    // 4. ABONNEMENTS TABELLE (webwelle_subscriptions)
    // =====================================================
    const createSubscriptionsTableQuery = `
      CREATE TABLE IF NOT EXISTS webwelle_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        booking_id UUID NOT NULL UNIQUE REFERENCES webwelle_bookings(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(20) NOT NULL DEFAULT 'active' 
          CHECK (status IN ('active', 'paused', 'cancelled', 'past_due', 'incomplete')),
        current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
        current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
        next_billing_date TIMESTAMP WITH TIME ZONE,
        cancelled_at TIMESTAMP WITH TIME ZONE,
        cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
        customer_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
        cancellation_reason TEXT,
        trial_start TIMESTAMP WITH TIME ZONE,
        trial_end TIMESTAMP WITH TIME ZONE
      );
      CREATE INDEX IF NOT EXISTS idx_subscriptions_booking_id ON webwelle_subscriptions(booking_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON webwelle_subscriptions(stripe_subscription_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status_next_billing ON webwelle_subscriptions(status, next_billing_date);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_cancelled ON webwelle_subscriptions(customer_cancelled);
    `;

    // =====================================================
    // 5. ADDON-BESTELLUNGEN TABELLE (webwelle_addon_orders)
    // =====================================================
    const createAddonOrdersTableQuery = `
      CREATE TABLE IF NOT EXISTS webwelle_addon_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        booking_id UUID NOT NULL REFERENCES webwelle_bookings(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        addon_key VARCHAR(100) NOT NULL,
        addon_label VARCHAR(255),
        billing VARCHAR(20) NOT NULL CHECK (billing IN ('oneTime', 'monthly')),
        price_id VARCHAR(255) NOT NULL,
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        currency VARCHAR(3) NOT NULL DEFAULT 'eur',
        checkout_mode VARCHAR(20) NOT NULL CHECK (checkout_mode IN ('payment', 'subscription')),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' 
          CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
        session_id VARCHAR(255) UNIQUE,
        stripe_invoice_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        notes TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_addon_orders_booking_id ON webwelle_addon_orders(booking_id);
      CREATE INDEX IF NOT EXISTS idx_addon_orders_status_created_at ON webwelle_addon_orders(status, created_at);
      CREATE INDEX IF NOT EXISTS idx_addon_orders_session_id ON webwelle_addon_orders(session_id);
      CREATE INDEX IF NOT EXISTS idx_addon_orders_addon_key ON webwelle_addon_orders(addon_key);
    `;
    
    // Rechnungen-Tabelle erstellen (Alternative zu webwelle_invoices)
    const createInvoicesTableQuery = `
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
        invoice_number VARCHAR(255),
        customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255),
        customer_number VARCHAR(50),
        amount_cents BIGINT NOT NULL,
        currency VARCHAR(10) DEFAULT 'EUR',
        status VARCHAR(50) NOT NULL,
        paid_at TIMESTAMP WITH TIME ZONE,
        due_date TIMESTAMP WITH TIME ZONE,
        pdf_url TEXT,
        hosted_invoice_url TEXT,
        issuer VARCHAR(50) DEFAULT 'Stripe',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_customer_email ON invoices(customer_email);
      CREATE INDEX IF NOT EXISTS idx_invoices_stripe_id ON invoices(stripe_invoice_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    `;
    
    // Blog-Posts Tabelle
    const createBlogPostsTableQuery = `
      CREATE TABLE IF NOT EXISTS blog_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        author VARCHAR(255) DEFAULT 'SEO-Team WebWelle',
        featured_image_url VARCHAR(500),
        meta_description TEXT,
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        featured BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'draft',
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(255)
      );
      CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
      CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
      CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
    `;
    
    // Blog-Images Tabelle für professionelle Bildverwaltung
    const createBlogImagesTableQuery = `
      CREATE TABLE IF NOT EXISTS blog_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        width INTEGER,
        height INTEGER,
        format VARCHAR(20) DEFAULT 'auto',
        alt_text TEXT,
        caption TEXT,
        position INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(255)
      );
      CREATE INDEX IF NOT EXISTS idx_blog_images_post_id ON blog_images(blog_post_id);
      CREATE INDEX IF NOT EXISTS idx_blog_images_position ON blog_images(blog_post_id, position);
      CREATE INDEX IF NOT EXISTS idx_blog_images_featured ON blog_images(is_featured);
    `;
    
    // Führe alle CREATE TABLE Queries in der richtigen Reihenfolge aus
    await client.query(createCustomersTableQuery);
    await client.query(createBookingsTableQuery);
    await client.query(createWebwelleInvoicesTableQuery);
    await client.query(createSubscriptionsTableQuery);
    await client.query(createAddonOrdersTableQuery);
    await client.query(createResetTokensTableQuery);
    await client.query(createPortalTokensTableQuery);
    await client.query(alterCustomersTableQuery);
    await client.query(createInvoicesTableQuery);
    await client.query(createBlogPostsTableQuery);
    await client.query(createBlogImagesTableQuery);
    
    // =====================================================
    // TRIGGER FÜR AUTOMATISCHE TIMESTAMPS
    // =====================================================
    const createTriggerFunctionQuery = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;
    await client.query(createTriggerFunctionQuery);
    
    console.log('✅ Alle Tabellen erfolgreich erstellt/überprüft:');
    console.log('   - customers');
    console.log('   - webwelle_bookings');
    console.log('   - webwelle_invoices');
    console.log('   - webwelle_subscriptions');
    console.log('   - webwelle_addon_orders');
    console.log('   - reset_tokens');
    console.log('   - customer_portal_tokens');
    console.log('   - invoices');
    console.log('   - blog_posts');
    console.log('   - blog_images');
    console.log('✅ Alle Indizes und Foreign Keys erstellt');
  } finally {
    client.release();
  }
}

// Adressfelder zur customers Tabelle hinzufügen (falls noch nicht vorhanden)
export async function ensureAddressColumnsExist(): Promise<void> {
  const client = await pool.connect();
  try {
    // Prüfe ob Adressfelder existieren
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'customers' 
      AND column_name IN ('street', 'city', 'zip', 'country')
    `);
    const existingColumns = columnCheck.rows.map(row => row.column_name);
    const missingColumns: string[] = [];
    
    if (!existingColumns.includes('street')) missingColumns.push('street VARCHAR(255)');
    if (!existingColumns.includes('city')) missingColumns.push('city VARCHAR(255)');
    if (!existingColumns.includes('zip')) missingColumns.push('zip VARCHAR(20)');
    if (!existingColumns.includes('country')) missingColumns.push('country VARCHAR(100)');
    
    if (missingColumns.length > 0) {
      console.log('📋 Füge fehlende Adressfelder hinzu:', missingColumns);
      const alterQuery = `ALTER TABLE customers ADD COLUMN ${missingColumns.join(', ADD COLUMN ')}`;
      await client.query(alterQuery);
      console.log('✅ Adressfelder erfolgreich hinzugefügt');
    } else {
      console.log('✅ Alle Adressfelder existieren bereits');
    }
  } catch (error) {
    console.error('❌ Fehler beim Hinzufügen der Adressfelder:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Rechnung-Schema
export interface InvoiceData {
  id?: string;
  stripe_invoice_id: string;
  invoice_number?: string | null;
  customer_id?: string | null; // Foreign Key zu customers (optional)
  customer_email: string;
  customer_name?: string | null;
  customer_number?: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  paid_at?: Date | null;
  due_date?: Date | null;
  pdf_url?: string | null;
  hosted_invoice_url?: string | null;
  issuer?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Rechnung speichern
export async function saveInvoice(invoiceData: InvoiceData): Promise<InvoiceData> {
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO invoices (
        stripe_invoice_id, invoice_number, customer_id, customer_email, customer_name, customer_number,
        amount_cents, currency, status, paid_at, due_date, pdf_url, hosted_invoice_url, issuer
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (stripe_invoice_id) 
      DO UPDATE SET
        invoice_number = EXCLUDED.invoice_number,
        customer_id = EXCLUDED.customer_id,
        customer_email = EXCLUDED.customer_email,
        customer_name = EXCLUDED.customer_name,
        customer_number = EXCLUDED.customer_number,
        amount_cents = EXCLUDED.amount_cents,
        currency = EXCLUDED.currency,
        status = EXCLUDED.status,
        paid_at = EXCLUDED.paid_at,
        due_date = EXCLUDED.due_date,
        pdf_url = EXCLUDED.pdf_url,
        hosted_invoice_url = EXCLUDED.hosted_invoice_url,
        issuer = EXCLUDED.issuer,
        updated_at = NOW()
      RETURNING *
    `;
    
    const values = [
      invoiceData.stripe_invoice_id,
      invoiceData.invoice_number || null,
      invoiceData.customer_id || null,
      invoiceData.customer_email,
      invoiceData.customer_name || null,
      invoiceData.customer_number || null,
      invoiceData.amount_cents,
      invoiceData.currency || 'EUR',
      invoiceData.status,
      invoiceData.paid_at || null,
      invoiceData.due_date || null,
      invoiceData.pdf_url || null,
      invoiceData.hosted_invoice_url || null,
      invoiceData.issuer || 'Stripe'
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
}

// Rechnungen nach Kunden-E-Mail abrufen
// Unterstützt beide Wege: customer_id (wenn registriert) oder customer_email (wenn über Stripe gebucht)
export async function getInvoicesByCustomerEmail(email: string): Promise<InvoiceData[]> {
  let client;
  let connectionError: Error | null = null;
  
  try {
    client = await pool.connect();
    // Versuche zuerst mit customer_id (wenn Kunde registriert ist)
    const customer = await getCustomerByEmail(email);
    if (customer?.id) {
      const query = `
        SELECT * FROM invoices 
        WHERE customer_id = $1 OR customer_email = $2 
        ORDER BY created_at DESC
      `;
      const result = await client.query(query, [customer.id, email]);
      client.release();
      return result.rows;
    }
    
    // Fallback: Nur customer_email
    const query = 'SELECT * FROM invoices WHERE customer_email = $1 ORDER BY created_at DESC';
    const result = await client.query(query, [email]);
    client.release();
    return result.rows;
  } catch (error) {
    if (client) client.release();
    connectionError = error instanceof Error ? error : new Error('Unbekannter Fehler');
    
    // SSL-Fallback für VPS
    if (connectionError.message.includes('certificate') || 
        connectionError.message.includes('SSL') || 
        connectionError.message.includes('TLS') ||
        connectionError.message.includes('unable to verify')) {
      const tempPool = await createTempPool({ rejectUnauthorized: false });
      
      try {
        client = await tempPool.connect();
        const customer = await getCustomerByEmail(email);
        if (customer?.id) {
          const query = `
            SELECT * FROM invoices 
            WHERE customer_id = $1 OR customer_email = $2 
            ORDER BY created_at DESC
          `;
          const result = await client.query(query, [customer.id, email]);
          client.release();
          await tempPool.end();
          return result.rows;
        }
        
        const query = 'SELECT * FROM invoices WHERE customer_email = $1 ORDER BY created_at DESC';
        const result = await client.query(query, [email]);
        client.release();
        await tempPool.end();
        return result.rows;
      } catch (fallbackError) {
        if (client) client.release();
        await tempPool.end();
        throw fallbackError;
      }
    }
    throw connectionError;
  }
}

// Rechnungen nach Booking-ID abrufen
interface WebwelleInvoiceRow {
  id: string;
  invoice_number: string;
  amount_cents: number;
  currency?: string;
  status: string;
  paid_at?: Date | null;
  due_date?: Date | null;
  pdf_url?: string | null;
  created_at?: Date;
  stripe_invoice_id?: string; // booking_id wird als stripe_invoice_id gemappt
}

interface BookingRow {
  customer_email?: string;
  customer_id?: string;
}

export async function getInvoicesByBookingId(bookingId: string): Promise<InvoiceData[]> {
  let client;
  let connectionError: Error | null = null;
  
  try {
    client = await pool.connect();
    // Prüfe zuerst webwelle_invoices (verknüpft mit booking_id)
    const webwelleInvoicesQuery = `
      SELECT 
        id,
        invoice_number,
        amount_cents,
        currency,
        status,
        paid_at,
        due_date,
        pdf_url,
        created_at,
        booking_id as stripe_invoice_id
      FROM webwelle_invoices 
      WHERE booking_id = $1 
      ORDER BY created_at DESC
    `;
    const webwelleResult = await client.query(webwelleInvoicesQuery, [bookingId]);
    
    // Dann prüfe invoices (verknüpft mit customer_email oder customer_id)
    const bookingQuery = 'SELECT customer_email, customer_id FROM webwelle_bookings WHERE id = $1';
    const bookingResult = await client.query(bookingQuery, [bookingId]);
    
    let invoices: InvoiceData[] = [];
    
    if (webwelleResult.rows.length > 0) {
      invoices = webwelleResult.rows.map((row: WebwelleInvoiceRow): InvoiceData => ({
        id: row.id,
        invoice_number: row.invoice_number || null,
        amount_cents: row.amount_cents,
        currency: row.currency || 'EUR',
        status: row.status,
        paid_at: row.paid_at || null,
        due_date: row.due_date || null,
        pdf_url: row.pdf_url || null,
        hosted_invoice_url: null,
        stripe_invoice_id: row.stripe_invoice_id || '',
        customer_email: bookingResult.rows[0]?.customer_email || '',
        customer_id: bookingResult.rows[0]?.customer_id || null,
        customer_name: null,
        customer_number: null,
        issuer: 'WebWelle',
        created_at: row.created_at,
        updated_at: row.created_at,
      }));
    }
    
    // Zusätzlich: Lade Stripe-Invoices (falls vorhanden)
    if (bookingResult.rows.length > 0) {
      const booking = bookingResult.rows[0] as BookingRow;
      let invoicesQuery = 'SELECT * FROM invoices WHERE customer_email = $1';
      const invoicesParams: (string | null)[] = [booking.customer_email || null];
      
      if (booking.customer_id) {
        invoicesQuery = 'SELECT * FROM invoices WHERE customer_id = $1 OR customer_email = $2';
        invoicesParams.push(booking.customer_email || null);
      }
      
      invoicesQuery += ' ORDER BY created_at DESC';
      const invoicesResult = await client.query(invoicesQuery, invoicesParams);
      
      // Kombiniere beide Ergebnisse (webwelle_invoices haben Priorität)
      const existingInvoiceNumbers = new Set(invoices.map(inv => inv.invoice_number));
      invoicesResult.rows.forEach((row: InvoiceData) => {
        if (!existingInvoiceNumbers.has(row.invoice_number)) {
          invoices.push(row);
        }
      });
    }
    
    client.release();
    return invoices;
  } catch (error) {
    if (client) client.release();
    connectionError = error instanceof Error ? error : new Error('Unbekannter Fehler');
    
    // SSL-Fallback für VPS
    if (connectionError.message.includes('certificate') || 
        connectionError.message.includes('SSL') || 
        connectionError.message.includes('TLS') ||
        connectionError.message.includes('unable to verify')) {
      const tempPool = await createTempPool({ rejectUnauthorized: false });
      
      try {
        client = await tempPool.connect();
        const webwelleInvoicesQuery = `
          SELECT 
            id,
            invoice_number,
            amount_cents,
            currency,
            status,
            paid_at,
            due_date,
            pdf_url,
            created_at,
            booking_id as stripe_invoice_id
          FROM webwelle_invoices 
          WHERE booking_id = $1 
          ORDER BY created_at DESC
        `;
        const webwelleResult = await client.query(webwelleInvoicesQuery, [bookingId]);
        
        const bookingQuery = 'SELECT customer_email, customer_id FROM webwelle_bookings WHERE id = $1';
        const bookingResult = await client.query(bookingQuery, [bookingId]);
        
        let invoices: InvoiceData[] = [];
        
        if (webwelleResult.rows.length > 0) {
          invoices = webwelleResult.rows.map((row: WebwelleInvoiceRow): InvoiceData => ({
            id: row.id,
            invoice_number: row.invoice_number || null,
            amount_cents: row.amount_cents,
            currency: row.currency || 'EUR',
            status: row.status,
            paid_at: row.paid_at || null,
            due_date: row.due_date || null,
            pdf_url: row.pdf_url || null,
            hosted_invoice_url: null,
            stripe_invoice_id: row.stripe_invoice_id || '',
            customer_email: bookingResult.rows[0]?.customer_email || '',
            customer_id: bookingResult.rows[0]?.customer_id || null,
            customer_name: null,
            customer_number: null,
            issuer: 'WebWelle',
            created_at: row.created_at,
            updated_at: row.created_at,
          }));
        }
        
        if (bookingResult.rows.length > 0) {
          const booking = bookingResult.rows[0] as BookingRow;
          let invoicesQuery = 'SELECT * FROM invoices WHERE customer_email = $1';
          const invoicesParams: (string | null)[] = [booking.customer_email || null];
          
          if (booking.customer_id) {
            invoicesQuery = 'SELECT * FROM invoices WHERE customer_id = $1 OR customer_email = $2';
            invoicesParams.push(booking.customer_email || null);
          }
          
          invoicesQuery += ' ORDER BY created_at DESC';
          const invoicesResult = await client.query(invoicesQuery, invoicesParams);
          
          const existingInvoiceNumbers = new Set(invoices.map(inv => inv.invoice_number));
          invoicesResult.rows.forEach((row: InvoiceData) => {
            if (!existingInvoiceNumbers.has(row.invoice_number)) {
              invoices.push(row);
            }
          });
        }
        
        client.release();
        await tempPool.end();
        return invoices;
      } catch (fallbackError) {
        if (client) client.release();
        await tempPool.end();
        throw fallbackError;
      }
    }
    throw connectionError;
  }
}

// Abonnement nach Booking-ID abrufen
export interface SubscriptionData {
  id: string;
  booking_id: string;
  stripe_subscription_id: string;
  status: string;
  current_period_start: Date;
  current_period_end: Date;
  next_billing_date?: Date | null;
  cancelled_at?: Date | null;
  cancel_at_period_end: boolean;
  customer_cancelled: boolean;
  cancellation_reason?: string | null;
  created_at?: Date;
}

export async function getSubscriptionByBookingId(bookingId: string): Promise<SubscriptionData | null> {
  let client;
  let connectionError: Error | null = null;
  
  try {
    client = await pool.connect();
    const query = `
      SELECT * FROM webwelle_subscriptions 
      WHERE booking_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const result = await client.query(query, [bookingId]);
    client.release();
    return result.rows[0] || null;
  } catch (error) {
    if (client) client.release();
    connectionError = error instanceof Error ? error : new Error('Unbekannter Fehler');
    
    // SSL-Fallback für VPS
    if (connectionError.message.includes('certificate') || 
        connectionError.message.includes('SSL') || 
        connectionError.message.includes('TLS') ||
        connectionError.message.includes('unable to verify')) {
      const tempPool = await createTempPool({ rejectUnauthorized: false });
      
      try {
        client = await tempPool.connect();
        const query = `
          SELECT * FROM webwelle_subscriptions 
          WHERE booking_id = $1 
          ORDER BY created_at DESC 
          LIMIT 1
        `;
        const result = await client.query(query, [bookingId]);
        client.release();
        await tempPool.end();
        return result.rows[0] || null;
      } catch (fallbackError) {
        if (client) client.release();
        await tempPool.end();
        throw fallbackError;
      }
    }
    throw connectionError;
  }
}

// Datenbankverbindung testen
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Datenbankverbindung fehlgeschlagen:', error);
    return false;
  }
}
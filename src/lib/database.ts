import { Pool } from 'pg';
import { sanitizeText } from './validation';

// PostgreSQL Verbindung
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // SSL für VPS-Server erforderlich
});

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
        currency, total_amount_cents, customer_name, customer_email, customer_phone,
        company_name, existing_website, existing_website_url, target_group,
        design_style, design_reference_url, selected_addons, message,
        raw_form_data, stripe_metadata, stripe_customer_id, stripe_payment_intent_id,
        stripe_subscription_id, stripe_invoice_id, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
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
export async function getBookingsByEmail(email: string): Promise<BookingData[]> {
  const client = await pool.connect();
  
  try {
    const query = 'SELECT * FROM webwelle_bookings WHERE customer_email = $1 ORDER BY created_at DESC';
    const result = await client.query(query, [email]);
    return result.rows;
  } finally {
    client.release();
  }
}

// Kunden-Schema (für bestehende customers Tabelle)
export interface CustomerData {
  id?: number;
  email: string;
  password_hash: string;
  name: string;
  phone?: string;
  company_name?: string;
  is_verified: boolean;
  verification_token?: string;
  reset_token?: string;
  reset_token_expires?: Date;
  created_at?: Date;
  updated_at?: Date;
}

// Kunde nach E-Mail abrufen
export async function getCustomerByEmail(email: string): Promise<CustomerData | null> {
  const client = await pool.connect();
  
  try {
    const query = 'SELECT * FROM customers WHERE email = $1';
    const result = await client.query(query, [email]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

// Kunde erstellen
export async function createCustomer(customerData: Omit<CustomerData, 'id' | 'created_at' | 'updated_at'>): Promise<CustomerData> {
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO customers (
        email, password_hash, name, phone, company_name, is_verified,
        verification_token, reset_token, reset_token_expires
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      customerData.email,
      customerData.password_hash,
      customerData.name,
      customerData.phone || null,
      customerData.company_name || null,
      customerData.is_verified,
      customerData.verification_token || null,
      customerData.reset_token || null,
      customerData.reset_token_expires || null
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
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
export async function validateResetToken(token: string): Promise<ResetTokenData | null> {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT * FROM reset_tokens 
      WHERE token = $1 AND expires_at > NOW() AND used = false
    `;
    
    const result = await client.query(query, [token]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

// Reset-Token als verwendet markieren
export async function markResetTokenAsUsed(token: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    const query = 'UPDATE reset_tokens SET used = true WHERE token = $1';
    await client.query(query, [token]);
  } finally {
    client.release();
  }
}

// Datenbank-Tabellen erstellen (Migration für bestehende Tabellen)
export async function createTables(): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Kunden-Tabelle (falls noch nicht vorhanden)
    const createCustomersTableQuery = `
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        company_name VARCHAR(255),
        is_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    // Passwort-Reset-Tokens-Tabelle (falls noch nicht vorhanden)
    const createResetTokensTableQuery = `
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client.query(createCustomersTableQuery);
    await client.query(createResetTokensTableQuery);
    
    console.log('✅ Zusätzliche Tabellen (customers, reset_tokens) erstellt/überprüft');
  } finally {
    client.release();
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
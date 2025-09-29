import { Pool } from 'pg';

// PostgreSQL Verbindung
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Datenbank-Schema für Buchungen
export interface BookingData {
  id?: number;
  session_id: string;
  package_type: 'nextjs' | 'wordpress';
  is_monthly: boolean;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  company_name: string;
  existing_website: string;
  target_group: string[];
  design_style: string;
  functions: string[];
  budget: string;
  message?: string;
  stripe_customer_id?: string;
  stripe_payment_intent_id?: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  created_at?: Date;
  updated_at?: Date;
}

// Buchung in Datenbank speichern
export async function saveBooking(bookingData: BookingData): Promise<BookingData> {
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO bookings (
        session_id, package_type, is_monthly, customer_name, customer_email, 
        customer_phone, company_name, existing_website, target_group, 
        design_style, functions, budget, message, stripe_customer_id, 
        stripe_payment_intent_id, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *
    `;
    
    const values = [
      bookingData.session_id,
      bookingData.package_type,
      bookingData.is_monthly,
      bookingData.customer_name,
      bookingData.customer_email,
      bookingData.customer_phone || null,
      bookingData.company_name,
      bookingData.existing_website,
      JSON.stringify(bookingData.target_group),
      bookingData.design_style,
      JSON.stringify(bookingData.functions),
      bookingData.budget,
      bookingData.message || null,
      bookingData.stripe_customer_id || null,
      bookingData.stripe_payment_intent_id || null,
      bookingData.status
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
    const query = 'SELECT * FROM bookings WHERE session_id = $1';
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
    const query = `
      UPDATE bookings 
      SET status = $1, 
          stripe_customer_id = $2, 
          stripe_payment_intent_id = $3,
          updated_at = NOW()
      WHERE session_id = $4
    `;
    
    await client.query(query, [
      status,
      stripeData?.customer_id || null,
      stripeData?.payment_intent_id || null,
      sessionId
    ]);
  } finally {
    client.release();
  }
}

// Alle Buchungen abrufen (für Admin)
export async function getAllBookings(): Promise<BookingData[]> {
  const client = await pool.connect();
  
  try {
    const query = 'SELECT * FROM bookings ORDER BY created_at DESC';
    const result = await client.query(query);
    return result.rows;
  } finally {
    client.release();
  }
}

// Kunden-Schema
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

// Passwort-Reset-Token Schema
export interface ResetTokenData {
  id?: number;
  email: string;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at?: Date;
}

// Datenbank-Tabellen erstellen (Migration)
export async function createTables(): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Buchungen-Tabelle
    const createBookingsTableQuery = `
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        package_type VARCHAR(50) NOT NULL,
        is_monthly BOOLEAN NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        company_name VARCHAR(255) NOT NULL,
        existing_website VARCHAR(50) NOT NULL,
        target_group JSONB,
        design_style VARCHAR(50) NOT NULL,
        functions JSONB,
        budget VARCHAR(50),
        message TEXT,
        stripe_customer_id VARCHAR(255),
        stripe_payment_intent_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    // Kunden-Tabelle
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
    
    // Passwort-Reset-Tokens-Tabelle
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
    
    await client.query(createBookingsTableQuery);
    await client.query(createCustomersTableQuery);
    await client.query(createResetTokensTableQuery);
    
    console.log('✅ Alle Datenbank-Tabellen erfolgreich erstellt');
  } finally {
    client.release();
  }
}

// Kunden-Datenbank-Funktionen

// Kunde erstellen
export async function createCustomer(customerData: Omit<CustomerData, 'id' | 'created_at' | 'updated_at'>): Promise<CustomerData> {
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO customers (
        email, password_hash, name, phone, company_name, 
        is_verified, verification_token, reset_token, reset_token_expires
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

// Kunde nach E-Mail finden
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

// Kunde nach ID finden
export async function getCustomerById(id: number): Promise<CustomerData | null> {
  const client = await pool.connect();
  
  try {
    const query = 'SELECT * FROM customers WHERE id = $1';
    const result = await client.query(query, [id]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

// Kunde aktualisieren
export async function updateCustomer(id: number, updates: Partial<CustomerData>): Promise<CustomerData> {
  const client = await pool.connect();
  
  try {
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const query = `
      UPDATE customers 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [id, ...fields.map(field => updates[field as keyof CustomerData])];
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
}

// Passwort-Reset-Token erstellen
export async function createResetToken(email: string, token: string, expiresAt: Date): Promise<ResetTokenData> {
  const client = await pool.connect();
  
  try {
    // Alte Tokens für diese E-Mail löschen
    await client.query('DELETE FROM reset_tokens WHERE email = $1', [email]);
    
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

// Passwort-Reset-Token validieren
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

// Passwort-Reset-Token als verwendet markieren
export async function markResetTokenAsUsed(token: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    const query = 'UPDATE reset_tokens SET used = true WHERE token = $1';
    await client.query(query, [token]);
  } finally {
    client.release();
  }
}

// Kunden-Buchungen abrufen
export async function getCustomerBookings(customerEmail: string): Promise<BookingData[]> {
  const client = await pool.connect();
  
  try {
    const query = 'SELECT * FROM bookings WHERE customer_email = $1 ORDER BY created_at DESC';
    const result = await client.query(query, [customerEmail]);
    return result.rows;
  } finally {
    client.release();
  }
}

export default pool;

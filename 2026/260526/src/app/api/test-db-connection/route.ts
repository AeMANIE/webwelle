// WICHTIG: Setze NODE_TLS_REJECT_UNAUTHORIZED für self-signed certificates
if (process.env.DATABASE_URL?.includes('sslmode=require') && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { NextResponse } from 'next/server';
import { Pool } from 'pg';

interface TestResult {
  name: string;
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
  stack?: string;
}

interface TestResults {
  timestamp: string;
  tests: TestResult[];
}

export async function GET() {
  const results: TestResults = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Test 1: Direkte Verbindung ohne Pool
  try {
    console.log('🔍 Test 1: Direkte Verbindung ohne Pool...');
    const directPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false, // Komplett ohne SSL
      connectionTimeoutMillis: 5000,
    });
    
    const client = await directPool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    await directPool.end();
    
    results.tests.push({
      name: 'Direkte Verbindung ohne SSL',
      success: true,
      message: 'Verbindung erfolgreich',
      data: result.rows[0]
    });
  } catch (error) {
    results.tests.push({
      name: 'Direkte Verbindung ohne SSL',
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }

  // Test 2: Verbindung mit SSL rejectUnauthorized: false
  try {
    console.log('🔍 Test 2: Verbindung mit SSL rejectUnauthorized: false...');
    const sslPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    
    const client = await sslPool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    await sslPool.end();
    
    results.tests.push({
      name: 'Verbindung mit SSL (rejectUnauthorized: false)',
      success: true,
      message: 'Verbindung erfolgreich',
      data: result.rows[0]
    });
  } catch (error) {
    results.tests.push({
      name: 'Verbindung mit SSL (rejectUnauthorized: false)',
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }

  // Test 3: Prüfe ob customers Tabelle existiert
  try {
    console.log('🔍 Test 3: Prüfe customers Tabelle...');
    const testPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
      connectionTimeoutMillis: 5000,
    });
    
    const client = await testPool.connect();
    
    // Prüfe ob Tabelle existiert
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
      ) as exists;
    `);
    
    if (tableCheck.rows[0].exists) {
      // Prüfe Tabellen-Struktur
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
        ORDER BY ordinal_position;
      `);
      
      // Prüfe ob Indizes existieren
      const indexes = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' 
        AND tablename = 'customers';
      `);
      
      // Zähle Kunden
      const count = await client.query('SELECT COUNT(*) as count FROM customers');
      
      client.release();
      await testPool.end();
      
      results.tests.push({
        name: 'customers Tabelle prüfen',
        success: true,
        message: 'Tabelle existiert',
        data: {
          exists: true,
          columns: columns.rows,
          indexes: indexes.rows,
          customerCount: parseInt(count.rows[0].count)
        }
      });
    } else {
      client.release();
      await testPool.end();
      
      results.tests.push({
        name: 'customers Tabelle prüfen',
        success: false,
        error: 'Tabelle existiert nicht'
      });
    }
  } catch (error) {
    results.tests.push({
      name: 'customers Tabelle prüfen',
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }

  // Test 4: Versuche INSERT (ohne Commit)
  try {
    console.log('🔍 Test 4: Test INSERT...');
    const insertPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
      connectionTimeoutMillis: 5000,
    });
    
    const client = await insertPool.connect();
    
    // Beginne Transaction
    await client.query('BEGIN');
    
    // Versuche INSERT
    const testEmail = `test_${Date.now()}@test.com`;
    const insertResult = await client.query(`
      INSERT INTO customers (
        email, name, is_verified, portal_activated
      ) VALUES ($1, $2, $3, $4)
      RETURNING id, email
    `, [testEmail, 'Test User', true, true]);
    
    // Rollback (nicht speichern)
    await client.query('ROLLBACK');
    
    client.release();
    await insertPool.end();
    
    results.tests.push({
      name: 'Test INSERT',
      success: true,
      message: 'INSERT erfolgreich (gerollt zurück)',
      data: insertResult.rows[0]
    });
  } catch (error) {
    results.tests.push({
      name: 'Test INSERT',
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      stack: error instanceof Error ? error.stack : undefined
    });
  }

  const allSuccess = results.tests.every((t) => t.success);
  
  return NextResponse.json({
    success: allSuccess,
    results
  }, { status: allSuccess ? 200 : 500 });
}


import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { Pool } from 'pg';
import { blockInProduction } from '@/lib/prod-guard';

export async function GET(request: NextRequest) {
  const blocked = blockInProduction();
  if (blocked) return blocked;

  try {
    // Admin-Auth
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return secureResponse({ error: 'DATABASE_URL nicht gesetzt' }, 500);
    }

    let client;
    let tempPool: Pool | null = null;
    
    try {
      const { pool } = await import('@/lib/database');
      client = await pool.connect();
    } catch (connectionError) {
      const errorMsg = connectionError instanceof Error ? connectionError.message : '';
      if (errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || errorMsg.includes('unable to verify')) {
        tempPool = new Pool({
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
        });
        client = await tempPool.connect();
      } else {
        throw connectionError;
      }
    }

    try {
      // Prüfe ob Tabelle existiert
      const tableCheckQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'webwelle_bookings'
        );
      `;
      const tableExists = await client.query(tableCheckQuery);
      
      if (!tableExists.rows[0]?.exists) {
        return secureResponse({
          success: false,
          error: 'Tabelle webwelle_bookings existiert nicht',
          solution: 'Führen Sie das SQL-Skript aus: info/database/setup_postgresql_tables.sql'
        }, 500);
      }

      // Prüfe Spalten
      const columnsQuery = `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'webwelle_bookings'
        ORDER BY ordinal_position;
      `;
      const columnsResult = await client.query(columnsQuery);
      
      // Prüfe Zeilenanzahl
      const countResult = await client.query('SELECT COUNT(*) as count FROM webwelle_bookings');
      const rowCount = parseInt(countResult.rows[0].count);

      // Test-Query
      const testQuery = 'SELECT id, created_at, status FROM webwelle_bookings LIMIT 1';
      let testResult;
      try {
        testResult = await client.query(testQuery);
      } catch (queryError) {
        return secureResponse({
          success: false,
          error: 'Fehler bei Test-Query',
          queryError: queryError instanceof Error ? queryError.message : 'Unbekannter Fehler',
          columns: columnsResult.rows.map(r => ({ name: r.column_name, type: r.data_type }))
        }, 500);
      }

      return secureResponse({
        success: true,
        tableExists: true,
        rowCount,
        columns: columnsResult.rows.map(r => ({ name: r.column_name, type: r.data_type })),
        sampleData: testResult.rows[0] || null,
        connection: {
          type: tempPool ? 'ssl-fallback' : 'normal',
          status: 'connected'
        }
      });
    } finally {
      if (client) {
        client.release();
      }
      if (tempPool) {
        await tempPool.end();
      }
    }
  } catch (error) {
    console.error('❌ Fehler in bookings/test:', error);
    return secureResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      stack: process.env.NODE_ENV !== 'production' 
        ? (error instanceof Error ? error.stack : undefined) 
        : undefined
    }, 500);
  }
}


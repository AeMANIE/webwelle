import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { Pool } from 'pg';

export async function GET(request: NextRequest) {
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
      // Alle Tabellen auflisten
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `;
      const tablesResult = await client.query(tablesQuery);
      const allTables = tablesResult.rows.map(row => row.table_name);

      // Wichtige Tabellen prüfen
      const requiredTables = [
        'customers',
        'webwelle_bookings',
        'webwelle_invoices',
        'webwelle_subscriptions',
        'webwelle_addon_orders',
        'invoices',
        'blog_posts',
        'reset_tokens',
        'customer_portal_tokens'
      ];

      const tableInfo: Record<string, {
        exists: boolean;
        columns?: Array<{ name: string; type: string; nullable: string }>;
        rowCount?: number;
      }> = {};

      for (const tableName of requiredTables) {
        const exists = allTables.includes(tableName);
        tableInfo[tableName] = { exists };

        if (exists) {
          // Spalten abrufen
          const columnsQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = $1
            ORDER BY ordinal_position;
          `;
          const columnsResult = await client.query(columnsQuery, [tableName]);
          tableInfo[tableName].columns = columnsResult.rows.map(row => ({
            name: row.column_name,
            type: row.data_type,
            nullable: row.is_nullable
          }));

          // Zeilenanzahl
          try {
            const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            tableInfo[tableName].rowCount = parseInt(countResult.rows[0].count);
          } catch {
            tableInfo[tableName].rowCount = -1;
          }
        }
      }

      return secureResponse({
        success: true,
        allTables,
        requiredTables,
        tableInfo,
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
    console.error('❌ Fehler beim Prüfen der Tabellen:', error);
    return secureResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      details: process.env.NODE_ENV !== 'production' 
        ? (error instanceof Error ? error.stack : undefined) 
        : undefined
    }, 500);
  }
}


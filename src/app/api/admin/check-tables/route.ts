import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { requireAdminAuth } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) return auth;

    let client;
    let tempPool: import('pg').Pool | null = null;
    
    try {
      client = await pool.connect();
    } catch (connectionError) {
      const errorMsg = connectionError instanceof Error ? connectionError.message : '';
      if (errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || errorMsg.includes('unable to verify')) {
        const { Pool: TempPool } = await import('pg');
        tempPool = new TempPool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
        });
        client = await tempPool.connect();
      } else {
        throw connectionError;
      }
    }

    try {
      // Prüfe alle Tabellen
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `;
      const tablesResult = await client.query(tablesQuery);
      const tables = tablesResult.rows.map(row => row.table_name);

      // Prüfe Spalten für wichtige Tabellen
      const checkTableColumns = async (tableName: string) => {
        const columnsQuery = `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position;
        `;
        const result = await client.query(columnsQuery, [tableName]);
        return result.rows;
      };

      // Prüfe customers Tabelle auf Adressfelder
      const customersColumns = await checkTableColumns('customers');
      const hasAddressFields = customersColumns.some(col => 
        ['street', 'city', 'zip', 'country'].includes(col.column_name)
      );

      // Prüfe ob wichtige Tabellen existieren
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

      const missingTables = requiredTables.filter(table => !tables.includes(table));

      // Prüfe Daten in wichtigen Tabellen
      const getTableCount = async (tableName: string) => {
        try {
          const result = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          return parseInt(result.rows[0].count);
        } catch {
          return -1; // Tabelle existiert nicht oder Fehler
        }
      };

      const tableCounts: Record<string, number> = {};
      for (const table of requiredTables) {
        if (tables.includes(table)) {
          tableCounts[table] = await getTableCount(table);
        }
      }

      return NextResponse.json({
        success: true,
        tables: {
          all: tables,
          required: requiredTables,
          missing: missingTables,
          counts: tableCounts
        },
        customers: {
          columns: customersColumns.map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES'
          })),
          hasAddressFields,
          addressFields: hasAddressFields 
            ? customersColumns.filter(col => ['street', 'city', 'zip', 'country'].includes(col.column_name))
            : []
        },
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
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      details: process.env.NODE_ENV !== 'production' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
}


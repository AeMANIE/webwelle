import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

interface TableInfo {
  name: string;
  exists: boolean;
  rowCount: number;
  columns?: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>;
  indexes?: Array<{
    indexname: string;
    indexdef: string;
  }>;
  foreignKeys?: Array<{
    constraint_name: string;
    table_name: string;
    column_name: string;
    foreign_table_name: string;
    foreign_column_name: string;
  }>;
}

interface DatabaseVerification {
  connection: {
    success: boolean;
    message: string;
    databaseUrl?: string;
  };
  tables: TableInfo[];
  summary: {
    totalTables: number;
    existingTables: number;
    missingTables: string[];
    totalRows: number;
  };
  recommendations: string[];
}

// Erwartete Tabellen basierend auf createTables()
const EXPECTED_TABLES = [
  'customers',
  'webwelle_bookings',
  'webwelle_invoices',
  'webwelle_subscriptions',
  'webwelle_addon_orders',
  'reset_tokens',
  'customer_portal_tokens',
  'invoices',
  'blog_posts'
];

export async function GET(request: NextRequest) {
  try {
    // Admin-Authentifizierung
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nicht autorisiert. Bitte melden Sie sich an.',
        verification: {
          connection: {
            success: false,
            message: 'Kein Authentifizierungs-Token gefunden'
          },
          tables: [],
          summary: {
            totalTables: EXPECTED_TABLES.length,
            existingTables: 0,
            missingTables: [],
            totalRows: 0
          },
          recommendations: ['❌ Bitte melden Sie sich im Admin-Portal an']
        }
      }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Nicht autorisiert. Sie benötigen Admin-Rechte.',
        verification: {
          connection: {
            success: false,
            message: 'Authentifizierung fehlgeschlagen'
          },
          tables: [],
          summary: {
            totalTables: EXPECTED_TABLES.length,
            existingTables: 0,
            missingTables: [],
            totalRows: 0
          },
          recommendations: ['❌ Authentifizierung erforderlich']
        }
      }, { status: 403 });
    }

    const verification: DatabaseVerification = {
      connection: {
        success: false,
        message: ''
      },
      tables: [],
      summary: {
        totalTables: EXPECTED_TABLES.length,
        existingTables: 0,
        missingTables: [],
        totalRows: 0
      },
      recommendations: []
    };

    let client;
    let tempPool: import('pg').Pool | null = null;

    try {
      // Versuche Verbindung mit dem Standard-Pool
      client = await pool.connect();
      verification.connection.success = true;
      verification.connection.message = 'Verbindung erfolgreich';
    } catch (connectionError) {
      // Bei SSL-Fehler: Erstelle temporären Pool
      const errorMsg = connectionError instanceof Error ? connectionError.message : '';
      if (errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || errorMsg.includes('unable to verify')) {
        const { Pool: TempPool } = await import('pg');
        tempPool = new TempPool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
        });
        client = await tempPool.connect();
        verification.connection.success = true;
        verification.connection.message = 'Verbindung erfolgreich (mit SSL-Fallback)';
      } else {
        verification.connection.success = false;
        verification.connection.message = `Verbindung fehlgeschlagen: ${errorMsg}`;
        return NextResponse.json({
          success: false,
          verification
        }, { status: 500 });
      }
    }

    try {
      // Maskiere sensible Daten in DATABASE_URL für Anzeige
      const dbUrl = process.env.DATABASE_URL || '';
      if (dbUrl) {
        try {
          const url = new URL(dbUrl);
          url.password = '***';
          verification.connection.databaseUrl = url.toString();
        } catch {
          verification.connection.databaseUrl = 'Konfiguriert (URL maskiert)';
        }
      }

      // Prüfe jede erwartete Tabelle
      for (const tableName of EXPECTED_TABLES) {
        const tableInfo: TableInfo = {
          name: tableName,
          exists: false,
          rowCount: 0
        };

        try {
          // Prüfe ob Tabelle existiert
          const tableCheck = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            ) as exists;
          `, [tableName]);

          tableInfo.exists = tableCheck.rows[0].exists;

          if (tableInfo.exists) {
            // Zähle Zeilen
            try {
              const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
              tableInfo.rowCount = parseInt(countResult.rows[0].count);
              verification.summary.totalRows += tableInfo.rowCount;
            } catch (countError) {
              console.warn(`Fehler beim Zählen der Zeilen in ${tableName}:`, countError);
            }

            // Hole Spalten-Informationen
            try {
              const columnsResult = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = $1
                ORDER BY ordinal_position;
              `, [tableName]);
              tableInfo.columns = columnsResult.rows;
            } catch (columnsError) {
              console.warn(`Fehler beim Abrufen der Spalten für ${tableName}:`, columnsError);
            }

            // Hole Index-Informationen
            try {
              const indexesResult = await client.query(`
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE schemaname = 'public' 
                AND tablename = $1;
              `, [tableName]);
              tableInfo.indexes = indexesResult.rows;
            } catch (indexesError) {
              console.warn(`Fehler beim Abrufen der Indizes für ${tableName}:`, indexesError);
            }

            // Hole Foreign Key-Informationen
            try {
              const fkResult = await client.query(`
                SELECT
                  tc.constraint_name,
                  tc.table_name,
                  kcu.column_name,
                  ccu.table_name AS foreign_table_name,
                  ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                  AND tc.table_name = $1;
              `, [tableName]);
              tableInfo.foreignKeys = fkResult.rows;
            } catch (fkError) {
              console.warn(`Fehler beim Abrufen der Foreign Keys für ${tableName}:`, fkError);
            }
          } else {
            verification.summary.missingTables.push(tableName);
          }
        } catch (tableError) {
          console.error(`Fehler beim Prüfen der Tabelle ${tableName}:`, tableError);
          tableInfo.exists = false;
        }

        verification.tables.push(tableInfo);
      }

      // Berechne Summary
      verification.summary.existingTables = verification.tables.filter(t => t.exists).length;

      // Generiere Empfehlungen
      if (verification.summary.missingTables.length > 0) {
        verification.recommendations.push(
          `⚠️ ${verification.summary.missingTables.length} Tabelle(n) fehlen: ${verification.summary.missingTables.join(', ')}. Führen Sie die Migration aus.`
        );
      }

      // Prüfe auf wichtige Indizes
      const customersTable = verification.tables.find(t => t.name === 'customers');
      if (customersTable?.exists) {
        const hasEmailIndex = customersTable.indexes?.some(idx => 
          idx.indexname.includes('email') || idx.indexdef.includes('email')
        );
        if (!hasEmailIndex) {
          verification.recommendations.push('⚠️ customers Tabelle: Index auf email-Spalte fehlt');
        }
      }

      const bookingsTable = verification.tables.find(t => t.name === 'webwelle_bookings');
      if (bookingsTable?.exists) {
        const hasSessionIdIndex = bookingsTable.indexes?.some(idx => 
          idx.indexname.includes('session_id') || idx.indexdef.includes('session_id')
        );
        if (!hasSessionIdIndex) {
          verification.recommendations.push('⚠️ webwelle_bookings Tabelle: Index auf session_id fehlt');
        }
      }

      // Prüfe auf Daten
      if (verification.summary.totalRows === 0) {
        verification.recommendations.push('ℹ️ Keine Daten in der Datenbank gefunden. Dies ist normal für eine neue Installation.');
      }

      // Prüfe ob DATABASE_URL öffentlich ist (Sicherheitshinweis)
      // dbUrl wurde bereits oben deklariert (Zeile 124)
      if (dbUrl.includes('145.223.81.159') || dbUrl.includes('DATABASE_PUBLICURL')) {
        verification.recommendations.push(
          '🔒 SICHERHEIT: Sie verwenden eine öffentliche Datenbank-URL. Wechseln Sie nach der Entwicklung zur internen URL für bessere Sicherheit.'
        );
      }

      return NextResponse.json({
        success: true,
        verification,
        timestamp: new Date().toISOString()
      });
    } finally {
      if (client) client.release();
      if (tempPool) await tempPool.end();
    }
  } catch (error) {
    console.error('Fehler bei Datenbank-Verifizierung:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      verification: {
        connection: {
          success: false,
          message: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
        },
        tables: [],
        summary: {
          totalTables: EXPECTED_TABLES.length,
          existingTables: 0,
          missingTables: EXPECTED_TABLES,
          totalRows: 0
        },
        recommendations: ['❌ Datenbank-Verifizierung fehlgeschlagen']
      }
    }, { status: 500 });
  }
}


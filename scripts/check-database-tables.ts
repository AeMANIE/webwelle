// WICHTIG: Setze NODE_TLS_REJECT_UNAUTHORIZED für self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { Pool } from 'pg';

// Datenbank-URL - MUSS in Umgebungsvariablen gesetzt sein
const DATABASE_URL = process.env.DATABASE_URL || process.env.DATABASE_PUBLICURL;
if (!DATABASE_URL) {
  console.error('❌ FEHLER: DATABASE_URL oder DATABASE_PUBLICURL muss in Umgebungsvariablen gesetzt sein!');
  console.error('Bitte setzen Sie die Umgebungsvariable: export DATABASE_URL="..."');
  process.exit(1);
}

// Erwartete Tabellen
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

interface TableInfo {
  name: string;
  exists: boolean;
  rowCount: number;
  columns: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>;
  indexes: Array<{
    indexname: string;
    indexdef: string;
  }>;
  foreignKeys: Array<{
    constraint_name: string;
    table_name: string;
    column_name: string;
    foreign_table_name: string;
    foreign_column_name: string;
  }>;
}

async function checkDatabase() {
  console.log('🔍 Verbinde zur Datenbank...\n');
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  let client;
  try {
    client = await pool.connect();
    console.log('✅ Verbindung erfolgreich!\n');
    console.log('='.repeat(80));
    console.log('DATENBANK-VERIFIZIERUNG');
    console.log('='.repeat(80));
    console.log('');

    const tables: TableInfo[] = [];

    // Prüfe jede erwartete Tabelle
    for (const tableName of EXPECTED_TABLES) {
      console.log(`\n📋 Prüfe Tabelle: ${tableName}`);
      console.log('-'.repeat(80));

      const tableInfo: TableInfo = {
        name: tableName,
        exists: false,
        rowCount: 0,
        columns: [],
        indexes: [],
        foreignKeys: []
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
          console.log('  ✅ Tabelle existiert');

          // Zähle Zeilen
          try {
            const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            tableInfo.rowCount = parseInt(countResult.rows[0].count);
            console.log(`  📊 Zeilen: ${tableInfo.rowCount}`);
          } catch (err) {
            console.log(`  ⚠️  Fehler beim Zählen: ${err instanceof Error ? err.message : 'Unbekannt'}`);
          }

          // Hole Spalten
          try {
            const columnsResult = await client.query(`
              SELECT column_name, data_type, is_nullable, column_default
              FROM information_schema.columns
              WHERE table_schema = 'public' 
              AND table_name = $1
              ORDER BY ordinal_position;
            `, [tableName]);
            tableInfo.columns = columnsResult.rows;
            console.log(`  📝 Spalten: ${tableInfo.columns.length}`);
            tableInfo.columns.forEach(col => {
              console.log(`     - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
          } catch (err) {
            console.log(`  ⚠️  Fehler beim Abrufen der Spalten: ${err instanceof Error ? err.message : 'Unbekannt'}`);
          }

          // Hole Indizes
          try {
            const indexesResult = await client.query(`
              SELECT indexname, indexdef
              FROM pg_indexes
              WHERE schemaname = 'public' 
              AND tablename = $1;
            `, [tableName]);
            tableInfo.indexes = indexesResult.rows;
            if (tableInfo.indexes.length > 0) {
              console.log(`  🔑 Indizes: ${tableInfo.indexes.length}`);
              tableInfo.indexes.forEach(idx => {
                console.log(`     - ${idx.indexname}`);
              });
            } else {
              console.log(`  ⚠️  Keine Indizes gefunden`);
            }
          } catch (err) {
            console.log(`  ⚠️  Fehler beim Abrufen der Indizes: ${err instanceof Error ? err.message : 'Unbekannt'}`);
          }

          // Hole Foreign Keys
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
            if (tableInfo.foreignKeys.length > 0) {
              console.log(`  🔗 Foreign Keys: ${tableInfo.foreignKeys.length}`);
              tableInfo.foreignKeys.forEach(fk => {
                console.log(`     - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
              });
            }
          } catch (err) {
            console.log(`  ⚠️  Fehler beim Abrufen der Foreign Keys: ${err instanceof Error ? err.message : 'Unbekannt'}`);
          }
        } else {
          console.log('  ❌ Tabelle existiert NICHT');
        }

        tables.push(tableInfo);
      } catch (err) {
        console.error(`  ❌ Fehler beim Prüfen der Tabelle ${tableName}:`, err);
        tables.push(tableInfo);
      }
    }

    // Zusammenfassung
    console.log('\n');
    console.log('='.repeat(80));
    console.log('ZUSAMMENFASSUNG');
    console.log('='.repeat(80));
    console.log('');

    const existingTables = tables.filter(t => t.exists);
    const missingTables = tables.filter(t => !t.exists);
    const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);

    console.log(`📊 Gesamt Tabellen: ${EXPECTED_TABLES.length}`);
    console.log(`✅ Vorhanden: ${existingTables.length}`);
    console.log(`❌ Fehlend: ${missingTables.length}`);
    console.log(`📝 Gesamt Zeilen: ${totalRows}`);
    console.log('');

    if (missingTables.length > 0) {
      console.log('❌ FEHLENDE TABELLEN:');
      missingTables.forEach(t => {
        console.log(`   - ${t.name}`);
      });
      console.log('');
      console.log('💡 Lösung: Führen Sie die Migration aus:');
      console.log('   GET /api/migrate');
      console.log('');
    }

    // Prüfe wichtige Indizes
    console.log('🔍 PRÜFUNG WICHTIGER INDIZES:');
    const customersTable = tables.find(t => t.name === 'customers');
    if (customersTable?.exists) {
      const hasEmailIndex = customersTable.indexes.some(idx => 
        idx.indexname.includes('email') || idx.indexdef.includes('email')
      );
      if (hasEmailIndex) {
        console.log('   ✅ customers.email: Index vorhanden');
      } else {
        console.log('   ⚠️  customers.email: Index fehlt');
      }
    }

    const bookingsTable = tables.find(t => t.name === 'webwelle_bookings');
    if (bookingsTable?.exists) {
      const hasSessionIdIndex = bookingsTable.indexes.some(idx => 
        idx.indexname.includes('session_id') || idx.indexdef.includes('session_id')
      );
      if (hasSessionIdIndex) {
        console.log('   ✅ webwelle_bookings.session_id: Index vorhanden');
      } else {
        console.log('   ⚠️  webwelle_bookings.session_id: Index fehlt');
      }
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('✅ PRÜFUNG ABGESCHLOSSEN');
    console.log('='.repeat(80));

    await pool.end();
  } catch (error) {
    console.error('❌ Fehler bei Datenbank-Verbindung:', error);
    if (client) client.release();
    await pool.end();
    process.exit(1);
  }
}

// Führe Prüfung aus
checkDatabase().catch(console.error);


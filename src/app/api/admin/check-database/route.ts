import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { requireAdminAuth } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) return auth;

    let client;
    try {
      client = await pool.connect();
    } catch (connectionError) {
      // Bei SSL-Fehler: Erstelle temporären Pool
      const errorMsg = connectionError instanceof Error ? connectionError.message : '';
      if (errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || errorMsg.includes('unable to verify')) {
        const { Pool: TempPool } = await import('pg');
        const tempPool = new TempPool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        });
        client = await tempPool.connect();
        
        try {
          // Prüfe ob customers Tabelle existiert
          const tableCheck = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'customers'
            ) as exists;
          `);
          
          const tableExists = tableCheck.rows[0].exists;
          let customerCount = 0;
          
          if (tableExists) {
            const countResult = await client.query('SELECT COUNT(*) as count FROM customers');
            customerCount = parseInt(countResult.rows[0].count);
          }
          
          client.release();
          await tempPool.end();
          
          return NextResponse.json({
            success: true,
            tableExists,
            customerCount,
            message: tableExists 
              ? `customers Tabelle existiert. ${customerCount} Kunde(n) gefunden.`
              : 'customers Tabelle existiert NICHT in der Datenbank.'
          });
        } catch (error) {
          if (client) client.release();
          await tempPool.end();
          throw error;
        }
      }
      throw connectionError;
    }
    
    // Normale Abfrage
    try {
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'customers'
        ) as exists;
      `);
      
      const tableExists = tableCheck.rows[0].exists;
      let customerCount = 0;
      
      if (tableExists) {
        const countResult = await client.query('SELECT COUNT(*) as count FROM customers');
        customerCount = parseInt(countResult.rows[0].count);
      }
      
      return NextResponse.json({
        success: true,
        tableExists,
        customerCount,
        message: tableExists 
          ? `customers Tabelle existiert. ${customerCount} Kunde(n) gefunden.`
          : 'customers Tabelle existiert NICHT in der Datenbank.'
      });
    } finally {
      client.release();
    }
  } catch {
    return NextResponse.json({ 
      success: false,
      error: 'Datenbank-Verbindung fehlgeschlagen'
    }, { status: 500 });
  }
}


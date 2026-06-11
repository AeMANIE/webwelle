import { pool } from './database';

export interface DatabaseOpsReport {
  connected: boolean;
  postgresVersion: string | null;
  databaseName: string | null;
  databaseSizeBytes: number | null;
  activeConnections: number | null;
  maxConnections: number | null;
  walLevel: string | null;
  archiveMode: string | null;
  pitrReady: boolean;
  pgStatStatementsEnabled: boolean;
  rtoRpo: {
    targetRpoHours: number;
    targetRtoHours: number;
  };
  backup: {
    coolifyScheduled: boolean | null;
    b2BucketConfigured: boolean;
    b2Endpoint: string | null;
    b2Region: string | null;
    retentionDays: number | null;
    lastBackupNote: string;
  };
  recommendations: string[];
  checkedAt: string;
}

function readBackupEnv() {
  return {
    coolifyScheduled: process.env.BACKUP_SCHEDULE_ENABLED === 'true' ? true : null,
    b2Bucket: process.env.BACKUP_B2_BUCKET || '',
    b2Endpoint: process.env.BACKUP_B2_ENDPOINT || null,
    b2Region: process.env.BACKUP_B2_REGION || null,
    retentionDays: process.env.BACKUP_RETENTION_DAYS
      ? Number(process.env.BACKUP_RETENTION_DAYS)
      : null,
    lastBackupIso: process.env.BACKUP_LAST_SUCCESS_AT || null,
  };
}

export async function collectDatabaseOpsReport(): Promise<DatabaseOpsReport> {
  const backupEnv = readBackupEnv();
  const recommendations: string[] = [];
  const base: DatabaseOpsReport = {
    connected: false,
    postgresVersion: null,
    databaseName: null,
    databaseSizeBytes: null,
    activeConnections: null,
    maxConnections: null,
    walLevel: null,
    archiveMode: null,
    pitrReady: false,
    pgStatStatementsEnabled: false,
    rtoRpo: { targetRpoHours: 24, targetRtoHours: 4 },
    backup: {
      coolifyScheduled: backupEnv.coolifyScheduled,
      b2BucketConfigured: Boolean(backupEnv.b2Bucket),
      b2Endpoint: backupEnv.b2Endpoint,
      b2Region: backupEnv.b2Region,
      retentionDays: backupEnv.retentionDays ?? 30,
      lastBackupNote: backupEnv.lastBackupIso
        ? `Letzter Backup-Zeitstempel (Env): ${backupEnv.lastBackupIso}`
        : 'Kein BACKUP_LAST_SUCCESS_AT gesetzt – Coolify/Backblaze B2 oder manuelles Backup prüfen',
    },
    recommendations,
    checkedAt: new Date().toISOString(),
  };

  if (process.env.DATABASE_PUBLICURL && process.env.NODE_ENV === 'production') {
    recommendations.push(
      'DATABASE_PUBLICURL in Production deaktivieren – DB nur intern erreichbar'
    );
  }

  if (!backupEnv.b2Bucket) {
    recommendations.push(
      'BACKUP_B2_BUCKET in Coolify/Env setzen und tägliche Backups nach Backblaze B2 aktivieren (siehe info/database/ops-runbook.md)'
    );
  }

  const client = await pool.connect();
  try {
    base.connected = true;

    const versionResult = await client.query('SELECT version() AS version');
    base.postgresVersion = String(versionResult.rows[0]?.version || '');

    const dbNameResult = await client.query('SELECT current_database() AS name');
    base.databaseName = String(dbNameResult.rows[0]?.name || '');

    const sizeResult = await client.query(
      'SELECT pg_database_size(current_database()) AS size'
    );
    base.databaseSizeBytes = Number(sizeResult.rows[0]?.size || 0);

    const connResult = await client.query(
      `SELECT COUNT(*)::int AS active FROM pg_stat_activity WHERE datname = current_database()`
    );
    base.activeConnections = Number(connResult.rows[0]?.active || 0);

    const maxConnResult = await client.query('SHOW max_connections');
    base.maxConnections = Number(maxConnResult.rows[0]?.max_connections || 0);

    const walResult = await client.query('SHOW wal_level');
    base.walLevel = String(walResult.rows[0]?.wal_level || '');

    const archiveResult = await client.query('SHOW archive_mode');
    base.archiveMode = String(archiveResult.rows[0]?.archive_mode || '');

    base.pitrReady =
      (base.walLevel === 'replica' || base.walLevel === 'logical') &&
      base.archiveMode === 'on';

    const extResult = await client.query(
      `SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') AS enabled`
    );
    base.pgStatStatementsEnabled = Boolean(extResult.rows[0]?.enabled);

    if (!base.pgStatStatementsEnabled) {
      recommendations.push(
        'pg_stat_statements aktivieren für Slow-Query-Monitoring (siehe ops-runbook)'
      );
    }

    if (!base.pitrReady) {
      recommendations.push(
        'PITR nicht aktiv (wal_level/archive_mode) – für RPO < 24h WAL-Archiving nach Backblaze B2 evaluieren'
      );
    }

    if (base.activeConnections && base.maxConnections) {
      const usage = base.activeConnections / base.maxConnections;
      if (usage > 0.8) {
        recommendations.push(
          `Connection-Pool nahe Limit (${base.activeConnections}/${base.maxConnections}) – PgBouncer prüfen`
        );
      }
    }
  } finally {
    client.release();
  }

  return base;
}

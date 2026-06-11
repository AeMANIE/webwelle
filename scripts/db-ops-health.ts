/**
 * Datenbank-Ops-Healthcheck (CLI)
 * Nutzung: npm run db:ops-health
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function main() {
  const { collectDatabaseOpsReport } = await import('../src/lib/database-ops');
  const report = await collectDatabaseOpsReport();

  console.log('='.repeat(72));
  console.log('WebWelle – Datenbank Ops Health');
  console.log('='.repeat(72));
  console.log(JSON.stringify(report, null, 2));

  if (report.recommendations.length > 0) {
    console.log('\nEmpfehlungen:');
    report.recommendations.forEach((item) => console.log(`  - ${item}`));
  }

  const healthy =
    report.connected &&
    (report.backup.b2BucketConfigured || report.backup.coolifyScheduled === true);

  if (!healthy) {
    console.error('\n❌ Backblaze-B2-Backup-Konfiguration unvollständig – Runbook beachten');
    process.exit(1);
  }

  console.log('\n✅ Basis-Checks OK (Backblaze B2 / Coolify gesetzt)');
}

main().catch((error) => {
  console.error('❌ Ops-Health fehlgeschlagen:', error);
  process.exit(1);
});

'use client';

import { useState, useEffect } from 'react';

interface TableInfo {
  name: string;
  exists: boolean;
  rowCount: number;
  columns?: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
  }>;
  indexes?: Array<{
    indexname: string;
    indexdef?: string;
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

export default function DatabaseTab() {
  const [verification, setVerification] = useState<DatabaseVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  console.log('🔍 DatabaseTab wird gerendert');

  const fetchVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/verify-database');
      
      // Prüfe HTTP-Status
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          setError('Nicht autorisiert. Bitte melden Sie sich erneut an.');
        } else if (response.status === 403) {
          setError('Zugriff verweigert. Sie benötigen Admin-Rechte.');
        } else {
          setError(errorData.error || `Fehler ${response.status}: ${response.statusText}`);
        }
        return;
      }
      
      const data = await response.json();
      
      // Zeige verification falls vorhanden (auch bei success=false)
      if (data.verification) {
        setVerification(data.verification);
      }
      
      if (data.success) {
        setError(null);
      } else {
        setError(data.error || 'Fehler beim Abrufen der Verifizierung');
      }
    } catch (err) {
      console.error('Fehler beim Abrufen der Verifizierung:', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Abrufen der Daten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerification();
  }, []);

  if (loading && !verification) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-4 text-muted-foreground">Lade Datenbank-Informationen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug: Zeige an, dass Komponente geladen wurde */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground mb-2">
          🔍 DatabaseTab geladen | Loading: {loading ? 'Ja' : 'Nein'} | Verification: {verification ? 'Vorhanden' : 'Fehlt'}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Datenbank-Verifizierung</h2>
          <p className="text-muted-foreground mt-1">
            Überprüfen Sie die Datenbank-Verbindung und alle Tabellen
          </p>
        </div>
        <button
          onClick={fetchVerification}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Lädt...' : 'Neu laden'}
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-xl">❌</span>
            <div>
              <strong className="block mb-1">Fehler:</strong>
              <p>{error}</p>
              {error.includes('autorisiert') && (
                <p className="text-sm mt-2 opacity-75">
                  Bitte melden Sie sich im Admin-Portal an und versuchen Sie es erneut.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {verification && (
        <>
          {/* Verbindungs-Status */}
          <div className={`p-4 rounded-lg border ${
            verification.connection.success 
              ? 'bg-green-500/10 border-green-500 text-green-600' 
              : 'bg-red-500/10 border-red-500 text-red-600'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {verification.connection.success ? '✅' : '❌'}
              </span>
              <div>
                <strong>Verbindung:</strong> {verification.connection.message}
                {verification.connection.databaseUrl && (
                  <div className="text-sm mt-1 opacity-75">
                    {verification.connection.databaseUrl}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground">Gesamt Tabellen</div>
              <div className="text-2xl font-bold text-foreground">
                {verification.summary.totalTables}
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground">Vorhanden</div>
              <div className="text-2xl font-bold text-green-600">
                {verification.summary.existingTables}
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground">Fehlend</div>
              <div className="text-2xl font-bold text-red-600">
                {verification.summary.missingTables.length}
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground">Gesamt Zeilen</div>
              <div className="text-2xl font-bold text-foreground">
                {verification.summary.totalRows.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Empfehlungen */}
          {verification.recommendations.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-600 p-4 rounded-lg">
              <strong className="block mb-2">Empfehlungen:</strong>
              <ul className="list-disc list-inside space-y-1">
                {verification.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm">{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tabellen-Liste */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Tabellen-Übersicht</h3>
            {verification.tables.map((table) => (
              <div
                key={table.name}
                className="bg-card border rounded-lg overflow-hidden"
              >
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-card/80 transition-colors"
                  onClick={() => setExpandedTable(expandedTable === table.name ? null : table.name)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {table.exists ? '✅' : '❌'}
                    </span>
                    <div>
                      <div className="font-semibold text-foreground">{table.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {table.exists 
                          ? `${table.rowCount} Zeile(n)` 
                          : 'Tabelle fehlt'}
                      </div>
                    </div>
                  </div>
                  {table.exists && (
                    <button className="text-muted-foreground hover:text-foreground">
                      {expandedTable === table.name ? '▼' : '▶'}
                    </button>
                  )}
                </div>

                {expandedTable === table.name && table.exists && (
                  <div className="border-t bg-background p-4 space-y-4">
                    {/* Spalten */}
                    {table.columns && table.columns.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">
                          Spalten ({table.columns.length})
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Name</th>
                                <th className="text-left p-2">Typ</th>
                                <th className="text-left p-2">Nullable</th>
                              </tr>
                            </thead>
                            <tbody>
                              {table.columns.map((col, idx) => (
                                <tr key={idx} className="border-b">
                                  <td className="p-2 font-mono">{col.column_name}</td>
                                  <td className="p-2 text-muted-foreground">{col.data_type}</td>
                                  <td className="p-2">
                                    {col.is_nullable === 'YES' ? '✅' : '❌'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Indizes */}
                    {table.indexes && table.indexes.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">
                          Indizes ({table.indexes.length})
                        </h4>
                        <div className="space-y-1">
                          {table.indexes.map((idx, idxIdx) => (
                            <div key={idxIdx} className="text-sm font-mono bg-background p-2 rounded border">
                              {idx.indexname}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


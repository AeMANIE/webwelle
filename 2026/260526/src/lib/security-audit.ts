/**
 * Sicherheits-Audit-Hilfsfunktionen
 * Zentrale Funktionen für Sicherheitsprüfungen
 */

/**
 * Prüft ob eine Route in Produktion verfügbar sein sollte
 */
export function isDebugRouteAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEBUG_ROUTES === 'true';
}

/**
 * Prüft ob sensible Daten in der Response enthalten sind
 */
export function sanitizeResponse(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'api_key', 'jwt_secret'];
  const sanitized = { ...data as Record<string, unknown> };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Validiert dass keine SQL-Injection möglich ist
 * (Prepared Statements sollten immer verwendet werden)
 */
export function validateSQLInput(input: string): boolean {
  // Prüfe auf gefährliche SQL-Zeichen
  const dangerousPatterns = [
    /('|(\\')|(;)|(--)|(\/\*)|(\*\/)|(xp_)|(sp_)|(exec)|(execute)|(union)|(select)|(insert)|(update)|(delete)|(drop)|(create)|(alter)|(truncate))/i
  ];

  // Erlaube normale Eingaben, aber blockiere SQL-Injection-Versuche
  // HINWEIS: Prepared Statements sind der beste Schutz!
  return !dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Rate Limiting Konfiguration für verschiedene Endpunkte
 */
export const RATE_LIMIT_CONFIG = {
  // Sehr restriktiv für Login-Endpunkte
  login: {
    windowMs: 15 * 60 * 1000, // 15 Minuten
    maxRequests: 5, // Max. 5 Versuche
  },
  // Restriktiv für TAN-Anfragen
  tan: {
    windowMs: 15 * 60 * 1000, // 15 Minuten
    maxRequests: 10, // Max. 10 Versuche
  },
  // Standard für API-Endpunkte
  api: {
    windowMs: 1 * 60 * 1000, // 1 Minute
    maxRequests: 60, // Max. 60 Requests pro Minute
  },
  // Sehr restriktiv für Admin-Endpunkte
  admin: {
    windowMs: 1 * 60 * 1000, // 1 Minute
    maxRequests: 30, // Max. 30 Requests pro Minute
  },
} as const;


// Zentrale Logging-Strategie für Sicherheitsereignisse
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SECURITY = 'security'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  userId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

class SecurityLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Maximale Anzahl gespeicherter Logs

  log(entry: Omit<LogEntry, 'timestamp'>): void {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date()
    };

    // Log zur Konsole ausgeben
    const logMessage = `[${logEntry.timestamp.toISOString()}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`;
    
    switch (logEntry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, logEntry.metadata);
        break;
      case LogLevel.INFO:
        console.info(logMessage, logEntry.metadata);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, logEntry.metadata);
        break;
      case LogLevel.ERROR:
        console.error(logMessage, logEntry.metadata);
        break;
      case LogLevel.SECURITY:
        console.error(`🚨 SECURITY: ${logMessage}`, logEntry.metadata);
        break;
    }

    // Log speichern
    this.logs.push(logEntry);
    
    // Alte Logs entfernen
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // In Produktion: Logs an externen Service senden
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(logEntry);
    }
  }

  private async sendToExternalService(_logEntry: LogEntry): Promise<void> {
    // Hier könnte Integration mit externen Logging-Services erfolgen
    // z.B. Sentry, LogRocket, oder eigene Logging-API
    try {
      // Beispiel: Sentry Integration
      // Sentry.captureMessage(logEntry.message, logEntry.level);
    } catch (error) {
      console.error('Fehler beim Senden an externen Logging-Service:', error);
    }
  }

  // Sicherheitsereignisse loggen
  logSecurityEvent(event: string, metadata?: Record<string, unknown>, request?: Request): void {
    this.log({
      level: LogLevel.SECURITY,
      message: event,
      ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
      userAgent: request?.headers.get('user-agent') || undefined,
      metadata
    });
  }

  // Login-Versuche loggen
  logLoginAttempt(email: string, success: boolean, request?: Request): void {
    this.logSecurityEvent(
      `Login-Versuch: ${email} - ${success ? 'ERFOLGREICH' : 'FEHLGESCHLAGEN'}`,
      { email, success },
      request
    );
  }

  // Fehlgeschlagene Authentifizierung loggen
  logFailedAuth(reason: string, request?: Request): void {
    this.logSecurityEvent(
      `Fehlgeschlagene Authentifizierung: ${reason}`,
      { reason },
      request
    );
  }

  // Rate-Limit-Überschreitung loggen
  logRateLimitExceeded(identifier: string, endpoint: string, request?: Request): void {
    this.logSecurityEvent(
      `Rate-Limit überschritten: ${identifier} auf ${endpoint}`,
      { identifier, endpoint },
      request
    );
  }

  // Verdächtige Aktivität loggen
  logSuspiciousActivity(activity: string, metadata?: Record<string, unknown>, request?: Request): void {
    this.logSecurityEvent(
      `Verdächtige Aktivität: ${activity}`,
      metadata,
      request
    );
  }

  // Alle Logs abrufen (für Admin-Panel)
  getLogs(level?: LogLevel, limit = 100): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(-limit);
  }

  // Sicherheitslogs abrufen
  getSecurityLogs(limit = 50): LogEntry[] {
    return this.logs
      .filter(log => log.level === LogLevel.SECURITY)
      .slice(-limit);
  }
}

// Singleton-Instanz
export const securityLogger = new SecurityLogger();

// Convenience-Funktionen
export const logSecurity = (event: string, metadata?: Record<string, unknown>, request?: Request) => {
  securityLogger.logSecurityEvent(event, metadata, request);
};

export const logLoginAttempt = (email: string, success: boolean, request?: Request) => {
  securityLogger.logLoginAttempt(email, success, request);
};

export const logFailedAuth = (reason: string, request?: Request) => {
  securityLogger.logFailedAuth(reason, request);
};

export const logRateLimitExceeded = (identifier: string, endpoint: string, request?: Request) => {
  securityLogger.logRateLimitExceeded(identifier, endpoint, request);
};

export const logSuspiciousActivity = (activity: string, metadata?: Record<string, unknown>, request?: Request) => {
  securityLogger.logSuspiciousActivity(activity, metadata, request);
};

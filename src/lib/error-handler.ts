// Zentrale Error-Handling-Strategie
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Spezifische Error-Klassen
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentifizierung fehlgeschlagen', context?: Record<string, unknown>) {
    super(message, 401, true, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Keine Berechtigung', context?: Record<string, unknown>) {
    super(message, 403, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Ressource nicht gefunden', context?: Record<string, unknown>) {
    super(message, 404, true, context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 409, true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit überschritten', context?: Record<string, unknown>) {
    super(message, 429, true, context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Datenbankfehler', context?: Record<string, unknown>) {
    super(message, 500, false, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, context?: Record<string, unknown>) {
    super(`${service} Fehler: ${message}`, 502, false, context);
  }
}

// Error-Handler für API-Routen
export function handleApiError(error: unknown): Response {
  console.error('API Error:', error);

  // Bekannte AppError-Instanzen
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        statusCode: error.statusCode,
        context: error.context
      }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Standard JavaScript Errors
  if (error instanceof Error) {
    return new Response(
      JSON.stringify({
        error: 'Interner Serverfehler',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
        statusCode: 500
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Unbekannte Errors
  return new Response(
    JSON.stringify({
      error: 'Unbekannter Fehler',
      statusCode: 500
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Async Error Wrapper für API-Routen
export function asyncHandler(fn: (request: Request, ...args: unknown[]) => Promise<Response>) {
  return async (request: Request, ...args: unknown[]) => {
    try {
      return await fn(request, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// Database Error Handler
export function handleDatabaseError(error: unknown, operation: string): DatabaseError {
  console.error(`Database Error in ${operation}:`, error);
  
  if (error instanceof Error) {
    return new DatabaseError(
      `Datenbankfehler bei ${operation}: ${error.message}`,
      { operation, originalError: error.message }
    );
  }
  
  return new DatabaseError(
    `Unbekannter Datenbankfehler bei ${operation}`,
    { operation }
  );
}

// Stripe Error Handler
export function handleStripeError(error: unknown, operation: string): ExternalServiceError {
  console.error(`Stripe Error in ${operation}:`, error);
  
  if (error instanceof Error) {
    return new ExternalServiceError(
      'Stripe',
      `${operation}: ${error.message}`,
      { operation, originalError: error.message }
    );
  }
  
  return new ExternalServiceError(
    'Stripe',
    `Unbekannter Fehler bei ${operation}`,
    { operation }
  );
}

// Email Error Handler
export function handleEmailError(error: unknown, operation: string): ExternalServiceError {
  console.error(`Email Error in ${operation}:`, error);
  
  if (error instanceof Error) {
    return new ExternalServiceError(
      'Email Service',
      `${operation}: ${error.message}`,
      { operation, originalError: error.message }
    );
  }
  
  return new ExternalServiceError(
    'Email Service',
    `Unbekannter Fehler bei ${operation}`,
    { operation }
  );
}

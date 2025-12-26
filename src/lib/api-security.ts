/**
 * Zentrale Sicherheits-Funktionen für API-Routen
 * Rate Limiting, Input Validation, SQL Injection Schutz
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS } from './rate-limit';
import { validateEmail, sanitizeText, validateUrl } from './validation';
import { verifyToken } from './auth';

/**
 * Rate Limiting Wrapper für API-Routen
 */
export async function applyRateLimit(
  request: NextRequest,
  config: { windowMs: number; maxRequests: number },
  identifier?: string
): Promise<NextResponse | null> {
  const ip = identifier || 
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const limiter = rateLimit(config);
  const result = await limiter(`api:${ip}`);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
        resetTime: result.resetTime,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null; // Rate limit OK, weiter mit Request
}

/**
 * Admin-Authentifizierung mit Rate Limiting
 */
export async function requireAdminAuth(
  request: NextRequest,
  applyRateLimitCheck = true
): Promise<{ user: { id: string; email: string; role: string; name: string } } | NextResponse> {
  try {
    // Rate Limiting für Admin-Endpunkte
    if (applyRateLimitCheck) {
      const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.API);
      if (rateLimitResponse) return rateLimitResponse;
    }

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return secureResponse({ error: 'Nicht autorisiert' }, 401);
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return secureResponse({ error: 'Nicht autorisiert' }, 403);
    }

    return { user };
  } catch (error) {
    console.error('❌ Fehler in requireAdminAuth:', error);
    return secureResponse(
      { error: 'Authentifizierungsfehler', details: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      500
    );
  }
}

/**
 * Input-Sanitization für SQL-Injection-Schutz
 * (Zusätzlich zu Prepared Statements)
 */
export function sanitizeSQLInput(input: string | null | undefined): string {
  if (!input) return '';
  
  // Entferne gefährliche Zeichen (zusätzlich zu Prepared Statements)
  return input
    .replace(/['";\\]/g, '') // Entferne SQL-Sonderzeichen
    .replace(/--/g, '') // Entferne SQL-Kommentare
    .replace(/\/\*/g, '') // Entferne Block-Kommentare
    .replace(/\*\//g, '')
    .trim();
}

/**
 * UUID-Validierung
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Input-Validierung für API-Requests
 */
export interface ValidationError {
  field: string;
  message: string;
}

export function validateAPIInput(
  data: Record<string, unknown>,
  rules: Record<string, { required?: boolean; type?: 'string' | 'number' | 'email' | 'url' | 'uuid'; minLength?: number; maxLength?: number }>
): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({ field, message: `${field} ist erforderlich` });
      continue;
    }

    // Skip validation if value is empty and not required
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // Type check
    if (rule.type) {
      switch (rule.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push({ field, message: `${field} muss ein String sein` });
            continue;
          }
          // Sanitize string input
          const sanitized = sanitizeText(value);
          if (sanitized !== value) {
            data[field] = sanitized; // Update data with sanitized value
          }
          break;
        case 'number':
          if (typeof value !== 'number' && isNaN(Number(value))) {
            errors.push({ field, message: `${field} muss eine Zahl sein` });
            continue;
          }
          break;
        case 'email':
          if (typeof value !== 'string' || !validateEmail(value)) {
            errors.push({ field, message: `${field} muss eine gültige E-Mail-Adresse sein` });
            continue;
          }
          break;
        case 'url':
          if (typeof value !== 'string' || !validateUrl(value)) {
            errors.push({ field, message: `${field} muss eine gültige URL sein` });
            continue;
          }
          break;
        case 'uuid':
          if (typeof value !== 'string' || !validateUUID(value)) {
            errors.push({ field, message: `${field} muss eine gültige UUID sein` });
            continue;
          }
          break;
      }
    }

    // Length checks (only for strings)
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({ field, message: `${field} muss mindestens ${rule.minLength} Zeichen lang sein` });
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({ field, message: `${field} darf maximal ${rule.maxLength} Zeichen lang sein` });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * CORS-Header für sichere API-Responses
 */
export function getSecureHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  };
}

/**
 * Sichere Response mit Security-Headers
 */
export function secureResponse(data: unknown, status = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  
  // Security-Headers hinzufügen
  const headers = getSecureHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}


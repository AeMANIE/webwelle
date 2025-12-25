import { NextResponse } from 'next/server';

// DEPRECATED: Diese Route ist nicht mehr aktiv
// Admin-Login erfordert jetzt TAN (Two-Factor Authentication)
// Verwenden Sie /api/auth/admin-request-tan und /api/auth/admin-verify-tan
export async function POST(request: Request) {
  return NextResponse.json({ 
    error: 'Diese Route ist nicht mehr verfügbar. Bitte verwenden Sie das TAN-System.',
    message: 'Admin-Login erfordert jetzt eine TAN (Two-Factor Authentication). Bitte verwenden Sie /api/auth/admin-request-tan'
  }, { status: 403 });
}

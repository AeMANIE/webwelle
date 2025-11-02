import { NextRequest, NextResponse } from 'next/server';
import { validateActivationToken } from '@/lib/portal-activation';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.json(
      { valid: false, error: 'Token fehlt' },
      { status: 400 }
    );
  }
  
  try {
    const result = await validateActivationToken(token);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Fehler bei Token-Validierung:', error);
    return NextResponse.json(
      { valid: false, error: 'Fehler bei Token-Validierung' },
      { status: 500 }
    );
  }
}


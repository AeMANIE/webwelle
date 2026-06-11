import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookies } from '@/lib/auth-cookies';
import { revokeRefreshToken } from '@/lib/refresh-token-store';
import { secureResponse } from '@/lib/api-security';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh-token')?.value;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    const response = secureResponse({
      success: true,
      message: 'Erfolgreich abgemeldet',
    });
    clearSessionCookies(response);
    return response;
  } catch (error) {
    console.error('Logout Fehler:', error);
    const response = secureResponse({ error: 'Ein Fehler ist aufgetreten' }, 500);
    clearSessionCookies(response);
    return response;
  }
}

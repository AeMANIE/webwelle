import { NextResponse } from 'next/server';
import { getSessionCookieOptions } from './auth-cookies';
import { getAdminTAN, getTAN } from './tan-store';

const CUSTOMER_TAN_PENDING = 'customer-tan-pending';
const ADMIN_TAN_PENDING = 'admin-tan-pending';
const TAN_PENDING_MAX_AGE = 10 * 60;

export async function attachCustomerTanPendingCookie(
  response: NextResponse,
  normalizedEmail: string,
  devTan?: string
): Promise<void> {
  if (devTan) {
    response.cookies.set(
      CUSTOMER_TAN_PENDING,
      JSON.stringify({
        email: normalizedEmail,
        tan: devTan,
        expiresAt: Date.now() + TAN_PENDING_MAX_AGE * 1000,
      }),
      getSessionCookieOptions(TAN_PENDING_MAX_AGE)
    );
    return;
  }

  const tanEntry = await getTAN(normalizedEmail);
  if (!tanEntry) return;

  response.cookies.set(
    CUSTOMER_TAN_PENDING,
    JSON.stringify({
      email: normalizedEmail,
      tan: tanEntry.tan,
      expiresAt: tanEntry.expiresAt,
    }),
    getSessionCookieOptions(Math.max(60, Math.floor((tanEntry.expiresAt - Date.now()) / 1000)))
  );
}

export async function attachAdminTanPendingCookie(
  response: NextResponse,
  normalizedEmail: string,
  devTan?: string
): Promise<void> {
  if (devTan) {
    response.cookies.set(
      ADMIN_TAN_PENDING,
      JSON.stringify({
        email: normalizedEmail,
        tan: devTan,
        expiresAt: Date.now() + TAN_PENDING_MAX_AGE * 1000,
      }),
      getSessionCookieOptions(TAN_PENDING_MAX_AGE)
    );
    return;
  }

  const tanEntry = await getAdminTAN(normalizedEmail);
  if (!tanEntry) return;

  response.cookies.set(
    ADMIN_TAN_PENDING,
    JSON.stringify({
      email: normalizedEmail,
      tan: tanEntry.tan,
      expiresAt: tanEntry.expiresAt,
    }),
    getSessionCookieOptions(Math.max(60, Math.floor((tanEntry.expiresAt - Date.now()) / 1000)))
  );
}

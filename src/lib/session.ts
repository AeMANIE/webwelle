import { NextResponse } from 'next/server';
import { createAccessToken, type User } from './auth';
import { setSessionCookies } from './auth-cookies';
import {
  generateRefreshTokenValue,
  REFRESH_MAX_AGE_MS,
  storeRefreshToken,
} from './refresh-token-store';

export async function attachSessionToResponse(
  response: NextResponse,
  user: User
): Promise<NextResponse> {
  const accessToken = createAccessToken(user);
  const refreshToken = generateRefreshTokenValue();
  const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE_MS);
  await storeRefreshToken(user, refreshToken, expiresAt);
  setSessionCookies(response, accessToken, refreshToken);
  return response;
}

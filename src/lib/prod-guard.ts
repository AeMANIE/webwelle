import { NextResponse } from 'next/server';
import { secureResponse } from './api-security';

export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function blockInProduction(): NextResponse | null {
  if (isProductionEnv()) {
    return secureResponse({ error: 'Not found' }, 404);
  }
  return null;
}

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAccessToken, type User } from './auth';
import { AUTH_ACCESS_COOKIE } from './auth-cookies';
import { isCustomerRole, isStaffRole } from './rbac';

export async function getServerSession(
  area?: 'admin' | 'customer'
): Promise<User | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  const user = verifyAccessToken(accessToken);
  if (!user) return null;
  if (area === 'admin' && !isStaffRole(user.role)) return null;
  if (area === 'customer' && !isCustomerRole(user.role)) return null;
  return user;
}

export async function requireServerSession(area: 'admin' | 'customer'): Promise<User> {
  const user = await getServerSession(area);
  if (!user) {
    redirect(area === 'admin' ? '/admin/login' : '/customer/login');
  }
  return user;
}

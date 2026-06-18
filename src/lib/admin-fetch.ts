/** Admin API fetch with session cookies + silent token refresh on 401 */
export async function adminFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const opts: RequestInit = {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init?.headers || {}),
    },
  };

  let res = await fetch(input, opts);
  if (res.status !== 401) return res;

  let needsRefresh = false;
  try {
    const data = await res.clone().json();
    needsRefresh = Boolean(data.needsRefresh);
  } catch {
    needsRefresh = true;
  }

  if (!needsRefresh) return res;

  const refresh = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'same-origin',
  });
  if (!refresh.ok) return res;

  return fetch(input, opts);
}

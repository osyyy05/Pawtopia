
const API_BASE_URL = 'http://127.0.0.1:8000';

let refreshPromise: Promise<string | null> | null = null;

const clearExpiredSession = () => {
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
  sessionStorage.removeItem('pawtopia_user');
};

const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = sessionStorage.getItem('refresh_token');

    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/token/refresh/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh: refreshToken,
          }),
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (!data.access) {
        return null;
      }

      sessionStorage.setItem('access_token', data.access);

      // Support refresh-token rotation if enabled.
      if (data.refresh) {
        sessionStorage.setItem('refresh_token', data.refresh);
      }

      return data.access as string;
    } catch {
      return null;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

export const authFetch = async (
  input: string,
  init: RequestInit = {}
): Promise<Response> => {
  const url = input.startsWith('http')
    ? input
    : `${API_BASE_URL}${input.startsWith('/') ? '' : '/'}${input}`;

  const headers = new Headers(init.headers);

  const accessToken = sessionStorage.getItem('access_token');

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  // Only retry when the server rejects authentication.
  if (response.status !== 401) {
    return response;
  }

  const newAccessToken = await refreshAccessToken();

  if (!newAccessToken) {
    clearExpiredSession();

    // Notify AuthContext so the UI doesn't remain
    // in an authenticated state with invalid tokens.
    window.dispatchEvent(new Event('pawtopia:session-expired'));

    return response;
  }

  const retryHeaders = new Headers(init.headers);
  retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);

  return fetch(url, {
    ...init,
    headers: retryHeaders,
  });
};

import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token from memory
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw error;
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !(originalRequest as { _retry?: boolean })._retry) {
      (originalRequest as { _retry?: boolean })._retry = true;
      try {
        const { data } = await axios.post<{ success: true; data: { accessToken: string } }>(
          '/api/auth/refresh',
          {},
          { withCredentials: true },
        );
        setAccessToken(data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch {
        setAccessToken(null);
        window.location.href = '/login';
      }
    }
    throw error;
  },
);

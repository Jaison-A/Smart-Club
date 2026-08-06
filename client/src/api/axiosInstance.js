import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// A tiny in-memory holder for the access token. Deliberately NOT
// localStorage/sessionStorage — keeping the access token in memory only
// means it disappears on a hard refresh (mitigating XSS token theft),
// while the refresh token lives in an httpOnly cookie the backend set.
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends the httpOnly refreshToken cookie
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// On a 401 (expired access token), try refreshing once, then retry the
// original request. If refresh itself fails, the caller's own catch
// block handles logging the user out.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/')) {
      originalRequest._retry = true;

      try {
        // Coalesce concurrent 401s into a single refresh call rather
        // than firing one refresh request per failed request.
        if (!refreshPromise) {
          refreshPromise = api.post('/auth/refresh-token').finally(() => {
            refreshPromise = null;
          });
        }
        const { data } = await refreshPromise;
        setAccessToken(data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

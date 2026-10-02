import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// -----------------------------------------------------------------
// Access token management (In-Memory + Silent Refresh)
// -----------------------------------------------------------------
// OWASP Güvenlik Standardı: Access token'lar XSS saldırılarına karşı
// localStorage yerine bellekte (in-memory) tutulur. Sayfa yenilemelerinde
// HttpOnly cookie üzerinden silent refresh akışı ile yeniden alınır.
let _accessToken = null;

export const setAccessToken = (token) => {
  _accessToken = token ?? null;
  
  if (token && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('accessTokenSet'));
  }
};

export const getAccessToken = () => {
  return _accessToken;
};

// JWT'den MandantId claim'ini al
export const getMandantIdFromToken = () => {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.MandantId || decoded.mandantId || decoded.mandant_id || null;
  } catch {
    return null;
  }
};

// -----------------------------------------------------------------
// Axios instance configuration
// -----------------------------------------------------------------
// API base origin (VITE_API_BASE_URL öncelikli, fallback VITE_API_URL)
export const API_ORIGIN =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8080`;

// Göreceli ya da tam avatar URL'ini tam URL'e dönüştürür
export function getAvatarUrl(bild) {
  if (!bild) return null;
  if (bild.startsWith('http://') || bild.startsWith('https://') || bild.startsWith('data:')) return bild;
  return `${API_ORIGIN}${bild.startsWith('/') ? '' : '/'}${bild}`;
}

const axiosClient = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true, // HTTP-only cookie support (refresh token)
  timeout: 30000, // 30 saniye timeout
});

// -----------------------------------------------------------------
// Request interceptor — Authorization + X-Mandant-Id + Content-Type handling
// -----------------------------------------------------------------
axiosClient.interceptors.request.use(
  (config) => {
    // 1️⃣ Authorization header ekle (eğer token varsa)
    const token = getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 2️⃣ Mandant ID ekle (JWT'den al)
    const mandantId = getMandantIdFromToken() || '00000000-0000-0000-0000-000000000000';
    config.headers['X-Mandant-Id'] = mandantId;

    // 3️⃣ Content-Type düzenlemesi (FormData için otomatik, JSON için manuel)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// -----------------------------------------------------------------
// Response interceptor — 401 handling with token refresh queue
// -----------------------------------------------------------------
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

const AUTH_ENDPOINTS = ['/auth/login', '/auth/verify', '/auth/refresh', '/auth/logout'];
const NO_RETRY_ENDPOINTS = [];
const isAuthEndpoint = (url) => AUTH_ENDPOINTS.some((endpoint) => url?.includes(endpoint));
const isNoRetryEndpoint = (url) => NO_RETRY_ENDPOINTS.some((endpoint) => url?.includes(endpoint));

// Backend hata mesajı normalizasyonu (nachricht/message/title alanları)
const normalizeError = (error) => {
  const data = error.response?.data;
  const status = error.response?.status;
  const url = error.config?.url;

  if (data) {
    if (import.meta.env.DEV) {
      console.error(`[API Error ${status}] ${url}:`, data?.message || data?.nachricht || data?.title || data);
    }

    if (!data.message) {
      if (data.nachricht) {
        data.message = data.nachricht;
      } else if (data.title) {
        data.message = data.title;
      }
    }

    const validationErrors = data.errors || data.fehler;
    if (!data.message && validationErrors && typeof validationErrors === 'object') {
      const messages = Object.values(validationErrors).flat();
      if (messages.length > 0) {
        data.message = messages.join('; ');
      }
    }

    if (!data.message) {
      data.message = `Sunucu hatası (${status})`;
    }
  }

  return error;
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    normalizeError(error);

    const originalRequest = error.config;

    // 401 değilse veya auth endpoint'iyse hemen reject et
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url) ||
      isNoRetryEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    // Token refresh zaten devam ediyorsa, kuyruğa ekle
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (token) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
          }
          return axiosClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // /auth/refresh endpoint'ini çağır (HttpOnly cookie ile)
      const refreshResponse = await axiosClient.post('/auth/refresh');
      const newToken = refreshResponse.data?.accessToken ?? refreshResponse.data?.token ?? null;

      if (newToken) {
        setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      } else {
        processQueue(null, null);
        delete originalRequest.headers['Authorization'];
      }

      isRefreshing = false;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      isRefreshing = false;
      setAccessToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('mandantId');
      localStorage.removeItem('accessToken');
      try { localStorage.removeItem('vika.chat.messages'); } catch { /* ignore */ }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vika:clearChat'));
      }

      // Login sayfasına yönlendir (zaten auth sayfasında değilsek)
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/verify') {
          window.location.href = '/login';
        }
      }

      return Promise.reject(refreshError);
    }
  }
);

// SignalR accessTokenFactory için: token varsa direkt döner, yoksa /auth/refresh dener
export const getOrRefreshToken = async () => {
  const current = getAccessToken();
  if (current) return current;

  try {
    const res = await fetch(`${API_ORIGIN}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newToken = data?.accessToken ?? data?.token ?? null;
    if (newToken) {
      setAccessToken(newToken);
      return newToken;
    }
  } catch {
    // Refresh başarısız — null döner
  }
  return null;
};

export default axiosClient;

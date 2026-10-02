import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { benutzerApi } from '../api/benutzerApi';
import { setAccessToken } from '../api/axiosClient';

// Backend farklı isimlendirmeler kullanabilir (mandantId / MandantId / mandant_id / tenantId).
function pickMandantId(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const id = (
    obj.mandantId ??
    obj.MandantId ??
    obj.mandant_id ??
    obj.tenantId ??
    obj.TenantId ??
    obj.mandant?.id ??
    obj.Mandant?.Id ??
    null
  );
  if (id == null) return null;
  return id;
}

function persistMandantId(obj) {
  const id = pickMandantId(obj);
  if (id) {
    localStorage.setItem('mandantId', String(id));
    return id;
  }
  return null;
}

// /auth/me bazı backend'lerde avatar/bild alanlarını döndürmez;
// eksikse /benutzer/{id} endpoint'inden tam profili çekip birleştiririz.
async function enrichProfile(profile) {
  if (!profile || typeof profile !== 'object') return profile;
  
  // Eğer zaten temel alanlar VE bild varsa, ek istek atma
  if (profile?.vorname && profile?.nachname && profile?.bild) {
    return profile;
  }
  
  if (profile?.id) {
    try {
      const res = await benutzerApi.getById(profile.id);
      return { ...profile, ...res.data };
    } catch {
      return profile; // Hata durumunda mevcut profili koru
    }
  }
  
  return profile;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Token ve kullanıcı profilini güncelleyen fonksiyon
  const login = useCallback(async (userData) => {
    if (!userData) return null;

    // Token varsa in-memory olarak set et
    const token = userData.accessToken ?? userData.token ?? null;
    if (token) {
      setAccessToken(token);
    }

    // Kullanıcı profilini tamamla
    let profile = null;
    if ((userData.email || userData.vorname) && !userData.id) {
      try {
        const res = await authApi.me();
        profile = await enrichProfile(res.data);
      } catch {
        const { accessToken: _a, token: _t, ...userInfo } = userData;
        profile = userInfo;
      }
    } else if ((userData.email || userData.vorname) && userData.id) {
      const { accessToken: _a, token: _t, ...rawInfo } = userData;
      profile = await enrichProfile(rawInfo);
    } else {
      try {
        const res = await authApi.me();
        profile = await enrichProfile(res.data);
      } catch {
        const { accessToken: _a, token: _t, ...userInfo } = userData;
        profile = userInfo;
      }
    }

    if (profile) {
      setUser(profile);
      localStorage.setItem('user', JSON.stringify(profile));
      persistMandantId(profile || userData);
    }

    return profile;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ağ hatası veya oturum zaten sonlanmış olabilir
    }
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('mandantId');
    localStorage.removeItem('accessToken'); // Eski versiyonlardan kalan varsa temizle
    try { localStorage.removeItem('vika.chat.messages'); } catch { /* ignore */ }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vika:clearChat'));
    }
  }, []);

  // Uygulama açılışında oturum doğrulama
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/login' || currentPath === '/verify') {
        if (!cancelled) setIsLoading(false);
        return;
      }

      // Hızlı UI için localStorage'daki önbellek kullanıcıyı yükle
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (!cancelled) setUser(parsed);
        } catch {
          localStorage.removeItem('user');
        }
      }

      try {
        // Backend'den oturumu doğrula (HttpOnly cookie veya silent refresh)
        const res = await authApi.me();
        if (!cancelled) {
          await login(res.data);
        }
      } catch {
        // Oturum geçersizse state'i sıfırla
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          try { localStorage.removeItem('vika.chat.messages'); } catch { /* ignore */ }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('vika:clearChat'));
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [login]);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

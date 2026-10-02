# 🔐 Vista.CoreX — Authentication & Authorization Flow

Bu doküman, Vista.CoreX (Saas.CoreX) frontend uygulamasının kimlik doğrulama (Authentication), iki aşamalı doğrulama (2FA), oturum devamlılığı (Silent Refresh), yetkilendirme (Role-Based Access Control - RBAC) ve güvenli token mimarisini açıklar.

---

## 1. Genel Akış Şeması (End-to-End)

```mermaid
sequenceDiagram
    autonumber
    actor User as Kullanıcı
    participant UI as React UI (Login/2FA)
    participant AuthHook as useAuth Hook
    participant Axios as Axios Client (In-Memory)
    participant API as Vista.Core .NET Backend

    Note over User,API: 1. AŞAMA: Giriş ve 2FA Talebi
    User->>UI: E-posta ve Parola Girer
    UI->>API: POST /api/auth/login { email, password }
    API-->>UI: 200 OK (2FA Gerekli, Doğrulama Kodu E-postaya Gönderildi)
    UI->>UI: /verify sayfasına yönlendirilir

    Note over User,API: 2. AŞAMA: 2FA Doğrulama & Oturum Açma
    User->>UI: 6 haneli doğrulama kodunu girer
    UI->>API: POST /api/auth/verify { email, code }
    API-->>Axios: 200 OK + Body: { accessToken, user } + Set-Cookie: refreshToken (HttpOnly, Secure)
    Axios->>Axios: AccessToken'ı RAM'de (in-memory) sakla
    UI->>AuthHook: login(userData) tetikle
    AuthHook->>UI: Dashboard'a (/) yönlendir

    Note over User,API: 3. AŞAMA: Korumalı İstekler & Silent Refresh
    UI->>Axios: GET /api/kunden (İstek)
    Axios->>API: Header: Authorization: Bearer <accessToken>
    API-->>UI: 200 OK (Müşteri Listesi)

    Note over Axios,API: Token Süresi Dolduğunda (401 Unauthorized)
    API-->>Axios: 401 Unauthorized
    Axios->>API: POST /api/auth/refresh (Cookie: refreshToken otomatik gider)
    API-->>Axios: 200 OK { accessToken: newJwt }
    Axios->>Axios: Yeni Token'ı belleğe yaz
    Axios->>API: Orijinal isteği otomatik yeniden dene
    API-->>UI: 200 OK
```

---

## 2. Token Güvenliği & Bellek Yönetimi (OWASP Uyumlu)

* **Access Token (Kısa Ömürlü JWT - örn. 15 dk):**
  * `localStorage` veya `sessionStorage` içinde **saklanmaz**. Bu sayede olası XSS açıklarında kötü niyetli script'lerin token'ı çalması engellenir.
  * Sadece React çalışma zamanı belleğinde (`_accessToken` değişkeninde) tutulur.
* **Refresh Token (Uzun Ömürlü - örn. 7 gün):**
  * Backend tarafından `HttpOnly`, `Secure`, `SameSite=Strict` cookie olarak tarayıcıya iletilir.
  * JavaScript tarafından okunamaz veya manipüle edilemez.
* **Silent Refresh:**
  * Tarayıcı yenilendiğinde (F5) veya access token süresi dolduğunda (401), Axios interceptor'ı otomatik olarak `/api/auth/refresh` çağrısı yaparak oturumu kullanıcıya hissettirmeden yeniler.

---

## 3. Bileşenler & Mimari Görevler

### 3.1 `useAuth` Hook (`src/hooks/useAuth.jsx`)
* **State Yönetimi:** `user`, `isLoading`, `isAuthenticated` durumlarını React Context üzerinden tüm ağaca dağıtır.
* **Oturum Başlatma (Init):** Uygulama ilk açıldığında arka planda `/api/auth/me` çağrısı yaparak aktif bir oturumun (HttpOnly cookie) olup olmadığını sorgular.
* **Profil Zenginleştirme (`enrichProfile`):** Eksik alanlar (profil fotoğrafı, şube bilgisi vb.) varsa `/api/benutzer/{id}` üzerinden tamamlar.

### 3.2 `ProtectedRoute` (`src/components/shared/ProtectedRoute.jsx`)
* **Oturum Kontrolü:** Kullanıcı oturum açmamışsa (`isAuthenticated === false`) doğrudan `/login` sayfasına yönlendirir.
* **Yükleme Ekranı:** Oturum kontrolü devam ederken (`isLoading === true`) `LoadingSpinner` göstererek sayfa sıçramalarını (flicker) önler.
* **Rol Bazlı Yetkilendirme (RBAC):** Rota için `allowedRoles` tanımlanmışsa (örn: `['SuperAdmin', 'Admin']`), kullanıcının rolünü kontrol eder. Yetkisiz ise erişimi engeller.

```jsx
// Örnek: Rol Korumalı Rota (App.jsx)
<Route path="benutzer" element={
  <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'Manager']}>
    <Benutzer />
  </ProtectedRoute>
} />
```

### 3.3 Çok Kiracılı Mimari (`X-Mandant-Id`)
* Her API isteğinde JWT claim'inden çözümlenen `MandantId` değeri `X-Mandant-Id` HTTP başlığı olarak eklenir.
* Backend, tenant izolasyonunu bu başlık ve doğrulanmış token claims üzerinden garanti altına alır.

# Frontend Yetkilendirme Yapısı - Implementation Guide

## 🎯 Genel Bakış

Backend'deki roller ve yetkilendirme yapısına göre frontend'in implement etmesi gereken kurallar.

---

## 📋 **1. Rol Tanımları (Backend ile Uyumlu)**

```typescript
export enum BenutzerRolle {
  SuperAdmin = "SuperAdmin",
  Admin = "Admin", 
  Manager = "Manager",
  Standard = "Standard",
  NurLesen = "NurLesen"
}

// Rol hiyerarşisi (yüksekten düşüğe)
export const RoleHierarchy = {
  SuperAdmin: 5,
  Admin: 4,
  Manager: 3,
  Standard: 2,
  NurLesen: 1
};
```

---

## 🔐 **2. Sayfa Erişim Kuralları**

### **2.1. Tamamen Açık Sayfalar (Anonim)**
❌ **YETKİ GEREKMİYOR**
- `/login` - Login sayfası
- `/register` - Kayıt sayfası (eğer varsa)
- `/forgot-password` - Şifre sıfırlama

### **2.2. Sadece Admin & SuperAdmin**
✅ **GEREKLİ ROLLER: `SuperAdmin`, `Admin`**
- `/benutzer` - Kullanıcı yönetimi sayfası
- `/benutzer/create` - Yeni kullanıcı ekleme
- `/benutzer/:id/edit` - Kullanıcı düzenleme

### **2.3. Tüm Yetkili Kullanıcılar**
✅ **GEREKLİ ROL: Herhangi bir rol (giriş yapmış)**
- `/dashboard` - Ana dashboard
- `/kunden` - Müşteri listesi
- `/kunden/:id` - Müşteri detay
- `/projekte` - Proje listesi
- `/projekte/:id` - Proje detay
- `/tickets` - Ticket listesi
- `/tickets/:id` - Ticket detay
- `/abonnements` - Abonelik listesi (görüntüleme)
- `/zahlungen` - Ödeme listesi (görüntüleme)
- `/berichte` - Raporlar
- `/chat` - Chat/Mesajlaşma
- `/ansprechpartner` - İletişim kişileri

---

## 🛠️ **3. CRUD İşlem Yetkileri (Sayfa İçi)**

### **3.1. Kullanıcı İşlemleri (/benutzer)**
| İşlem | Gerekli Rol | Frontend Davranışı |
|-------|-------------|-------------------|
| **Sayfa Erişimi** | Admin, SuperAdmin | Diğer roller 403 veya redirect |
| **Liste Görüntüleme** | Admin, SuperAdmin | - |
| **Kullanıcı Ekleme** | Admin, SuperAdmin | "Ekle" butonu sadece bu rollere görünsün |
| **Kullanıcı Düzenleme** | Admin, SuperAdmin | "Düzenle" butonu sadece bu rollere görünsün |
| **Kullanıcı Silme** | Admin, SuperAdmin | "Sil" butonu sadece bu rollere görünsün |

### **3.2. Abonelik İşlemleri (/abonnements)**
| İşlem | Gerekli Rol | Frontend Davranışı |
|-------|-------------|-------------------|
| **Liste Görüntüleme** | Tüm roller | Herkes görebilir |
| **Detay Görüntüleme** | Tüm roller | Herkes görebilir |
| **Abonelik Ekleme** | Admin, SuperAdmin | "Ekle" butonu sadece bu rollere görünsün |
| **Abonelik Düzenleme** | Admin, SuperAdmin | "Düzenle" butonu sadece bu rollere görünsün |
| **Abonelik Silme** | Admin, SuperAdmin | "Sil" butonu sadece bu rollere görünsün |

### **3.3. Ödeme İşlemleri (/zahlungen)**
| İşlem | Gerekli Rol | Frontend Davranışı |
|-------|-------------|-------------------|
| **Liste Görüntüleme** | Tüm roller | Herkes görebilir |
| **Detay Görüntüleme** | Tüm roller | Herkes görebilir |
| **Ödeme Kaydı Ekleme** | Admin, SuperAdmin | "Ekle" butonu sadece bu rollere görünsün |
| **Ödeme Düzenleme** | Admin, SuperAdmin | "Düzenle" butonu sadece bu rollere görünsün |
| **Ödeme Silme** | Admin, SuperAdmin | "Sil" butonu sadece bu rollere görünsün |

### **3.4. Diğer Tüm İşlemler (Müşteri, Proje, Ticket vb.)**
| İşlem | Gerekli Rol | Frontend Davranışı |
|-------|-------------|-------------------|
| **Liste Görüntüleme** | Tüm roller | Herkes görebilir |
| **Detay Görüntüleme** | Tüm roller | Herkes görebilir |
| **Ekleme** | Tüm roller* | "Ekle" butonu herkese görünsün |
| **Düzenleme** | Tüm roller* | "Düzenle" butonu herkese görünsün |
| **Silme** | Tüm roller* | "Sil" butonu herkese görünsün |

**\*İstisna:** `NurLesen` rolü için sadece görüntüleme, düzenleme/silme/ekleme butonları GİZLENMELİ!

---

## 📱 **4. Sidebar Menü Görünürlük Kuralları**

### **4.1. Tüm Rollere Görünen Menüler**
✅ **Dashboard, Kunden, Projekte, Tickets, Berichte, Chat, Ansprechpartner**

### **4.2. Sadece Admin & SuperAdmin'e Görünen Menüler**
🔒 **Benutzer (Kullanıcı Yönetimi)**

### **4.3. Rol Bazlı Menü Filtreleme**
```typescript
const menuItems = [
  { name: "Dashboard", path: "/dashboard", roles: ["SuperAdmin", "Admin", "Manager", "Standard", "NurLesen"] },
  { name: "Kunden", path: "/kunden", roles: ["SuperAdmin", "Admin", "Manager", "Standard", "NurLesen"] },
  { name: "Projekte", path: "/projekte", roles: ["SuperAdmin", "Admin", "Manager", "Standard", "NurLesen"] },
  { name: "Tickets", path: "/tickets", roles: ["SuperAdmin", "Admin", "Manager", "Standard", "NurLesen"] },
  { name: "Benutzer", path: "/benutzer", roles: ["SuperAdmin", "Admin"] }, // KISITLI!
  { name: "Abonnements", path: "/abonnements", roles: ["SuperAdmin", "Admin", "Manager", "Standard", "NurLesen"] },
  { name: "Zahlungen", path: "/zahlungen", roles: ["SuperAdmin", "Admin", "Manager", "Standard", "NurLesen"] },
  { name: "Berichte", path: "/berichte", roles: ["SuperAdmin", "Admin", "Manager", "Standard", "NurLesen"] },
  { name: "Chat", path: "/chat", roles: ["SuperAdmin", "Admin", "Manager", "Standard", "NurLesen"] },
];

// Filtreleme
const filteredMenu = menuItems.filter(item => 
  item.roles.includes(currentUserRole)
);
```

---

## 🧩 **5. Component Seviyesinde Yetki Kontrolü**

### **5.1. Helper Fonksiyonlar**

```typescript
// src/utils/roleHelper.ts

export const hasRole = (userRole: string, requiredRoles: string[]): boolean => {
  return requiredRoles.includes(userRole);
};

export const canEdit = (userRole: string): boolean => {
  return userRole !== "NurLesen";
};

export const canDelete = (userRole: string): boolean => {
  return userRole !== "NurLesen";
};

export const canCreate = (userRole: string): boolean => {
  return userRole !== "NurLesen";
};

export const isAdmin = (userRole: string): boolean => {
  return ["SuperAdmin", "Admin"].includes(userRole);
};

export const canManageUsers = (userRole: string): boolean => {
  return isAdmin(userRole);
};

export const canManageAbonnements = (userRole: string): boolean => {
  return isAdmin(userRole);
};

export const canManageZahlungen = (userRole: string): boolean => {
  return isAdmin(userRole);
};
```

### **5.2. Route Koruma Componenti**

```typescript
// src/components/ProtectedRoute.tsx

import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { hasRole } from "../utils/roleHelper";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !hasRole(user.rolle, requiredRoles)) {
    return <Navigate to="/unauthorized" replace />; // veya "/dashboard"
  }

  return <>{children}</>;
};
```

### **5.3. Buton Görünürlük Kontrolü**

```typescript
// Örnek: Tablo içinde aksiyon butonları

import { canEdit, canDelete, isAdmin } from "../utils/roleHelper";

const KundenTable = () => {
  const { user } = useAuth();

  return (
    <table>
      <tbody>
        {kunden.map(kunde => (
          <tr key={kunde.id}>
            <td>{kunde.unternehmen}</td>
            <td>
              {canEdit(user.rolle) && (
                <button onClick={() => edit(kunde.id)}>Düzenle</button>
              )}
              {canDelete(user.rolle) && (
                <button onClick={() => delete(kunde.id)}>Sil</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

---

## 🚦 **6. Route Tanımlamaları (React Router)**

```typescript
// src/App.tsx veya routes.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Anonim Erişim */}
        <Route path="/login" element={<LoginPage />} />

        {/* Tüm Roller */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        <Route path="/kunden" element={
          <ProtectedRoute>
            <KundenPage />
          </ProtectedRoute>
        } />

        {/* Sadece Admin & SuperAdmin */}
        <Route path="/benutzer" element={
          <ProtectedRoute requiredRoles={["SuperAdmin", "Admin"]}>
            <BenutzerPage />
          </ProtectedRoute>
        } />

        {/* Unauthorized Page */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 📊 **7. NurLesen Rolü Özel Kuralları**

`NurLesen` rolüne sahip kullanıcılar için:

✅ **İZİN VERİLEN:**
- Tüm sayfalara erişim (Benutzer hariç)
- Tüm listeleri görüntüleme
- Detay sayfalarını görüntüleme
- Dashboard istatistiklerini görme

❌ **YASAK:**
- Herhangi bir "Ekle" butonu görmemeli
- Herhangi bir "Düzenle" butonu görmemeli
- Herhangi bir "Sil" butonu görmemeli
- Form submit butonları disabled olmalı (varsa)

### **7.1. NurLesen için Component Örneği**

```typescript
const KundenPage = () => {
  const { user } = useAuth();
  const isReadOnly = user.rolle === "NurLesen";

  return (
    <div>
      <h1>Kunden</h1>

      {!isReadOnly && (
        <button onClick={handleCreate}>Neuer Kunde</button>
      )}

      <table>
        {/* ... */}
        <td>
          {!isReadOnly && (
            <>
              <button onClick={handleEdit}>Bearbeiten</button>
              <button onClick={handleDelete}>Löschen</button>
            </>
          )}
        </td>
      </table>
    </div>
  );
};
```

---

## 🎨 **8. UI/UX Önerileri**

### **8.1. Yetkisiz Erişim Durumunda**
- 403 Forbidden sayfası göster
- veya `/dashboard`'a yönlendir
- Toast notification: "Bu sayfaya erişim yetkiniz yok!"

### **8.2. Buton Gizleme vs Disabled**
- ❌ **Önerilmeyen:** Butonları disabled yap (karışıklık yaratır)
- ✅ **Önerilen:** Butonları tamamen gizle (daha temiz UX)

### **8.3. Rol Badge Gösterimi**
```typescript
const RoleBadge = ({ role }: { role: string }) => {
  const colors = {
    SuperAdmin: "bg-red-500",
    Admin: "bg-orange-500",
    Manager: "bg-blue-500",
    Standard: "bg-green-500",
    NurLesen: "bg-gray-500"
  };

  return (
    <span className={`${colors[role]} text-white px-2 py-1 rounded`}>
      {role}
    </span>
  );
};
```

---

## ✅ **9. Implementation Checklist**

### **Phase 1: Temel Yetki Sistemi**
- [ ] `roleHelper.ts` oluştur
- [ ] `ProtectedRoute` component'ini güncelle (rol kontrolü ekle)
- [ ] Auth context'e rol bilgisi ekle
- [ ] Route tanımlarına rol kontrolü ekle

### **Phase 2: Sayfa Korumaları**
- [ ] `/benutzer` sayfasını Admin & SuperAdmin ile kısıtla
- [ ] Diğer tüm sayfaları `Authorize` ile koru
- [ ] Unauthorized (403) sayfası ekle

### **Phase 3: Buton Görünürlük Kontrolü**
- [ ] Tüm sayfalarda "Ekle" butonlarını NurLesen'den gizle
- [ ] Tüm tablolarda "Düzenle" butonlarını NurLesen'den gizle
- [ ] Tüm tablolarda "Sil" butonlarını NurLesen'den gizle
- [ ] Abonnement & Zahlung sayfalarında POST/PUT/DELETE butonlarını sadece Admin & SuperAdmin'e göster

### **Phase 4: Sidebar Menü Filtreleme**
- [ ] Sidebar'da menüleri rol bazlı filtrele
- [ ] "Benutzer" menüsünü sadece Admin & SuperAdmin'e göster

### **Phase 5: Test & Validation**
- [ ] Her rol için tüm sayfaları test et
- [ ] Buton görünürlüklerini doğrula
- [ ] Route erişimlerini doğrula
- [ ] API isteklerinde backend'in 403 döndüğünü kontrol et

---

## 🔗 **10. Backend ile Uyum**

Frontend'in backend'deki `[Authorize]` attribute'larına tam uyumlu çalışması için:

| Backend Attribute | Frontend Kontrolü |
|-------------------|-------------------|
| `[Authorize]` | `isAuthenticated` kontrolü |
| `[Authorize(Roles = "Admin,SuperAdmin")]` | `hasRole(user.rolle, ["Admin", "SuperAdmin"])` |
| `[AllowAnonymous]` | Yetki kontrolü yok |

---

## 🚨 **11. Güvenlik Notları**

⚠️ **ÖNEMLİ:** 
- Frontend'deki yetki kontrolleri sadece **UI/UX amaçlıdır**!
- **Gerçek güvenlik backend'de** sağlanmalıdır.
- Frontend kontrolleri kullanıcı deneyimini iyileştirir, güvenlik sağlamaz.
- Yetkisiz isteklerde backend'in **401/403** döndürdüğünden emin olun.
- Tüm API isteklerinde JWT token kontrolü yapın.

---

**Hazırlayan:** Vista.Core Development Team  
**Tarih:** 2025  
**Backend Referans:** [Yetkilendirme-Tablosu.md](./Yetkilendirme-Tablosu.md)

---

## ✅ **12. Implementation Raporu — 25 Nisan 2026**

### Yapılan Değişiklikler

#### 1. `src/hooks/usePermission.js` — YENİ DOSYA
- `hasRole(rolle, allowedRoles)` — pure helper, hook dışında da kullanılabilir
- `isAdminRole`, `canEditRole`, `canDeleteRole`, `canCreateRole` — pure helpers
- `usePermission()` React hook'u: `isAdmin`, `isSuperAdmin`, `canEdit`, `canDelete`, `canCreate`, `hasRole` döndürür

#### 2. `src/components/shared/ProtectedRoute.jsx`
- `allowedRoles?: string[]` prop'u eklendi
- `allowedRoles` verilirse ve kullanıcının rolü listede yoksa `/` (dashboard) yönlendirmesi yapılır

#### 3. `src/App.jsx`
- `/benutzer` rotası `ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']}` ile sarıldı
- Diğer roller `/benutzer`'a URL ile de giremez, dashboard'a yönlenir

#### 4. `src/components/layout/Sidebar.jsx`
- `hasRole` import edildi
- `navGroups` içinde `/benutzer` öğesine `allowedRoles: ['SuperAdmin', 'Admin']` eklendi
- `group.items.filter(item => !item.allowedRoles || hasRole(userRolle, item.allowedRoles))` ile yetkisiz menüler gizlenir

#### 5. `src/pages/Benutzer.jsx`
- `usePermission` import edildi, `isAdmin` kullanıldı
- Tablo: Düzenle + Sil butonları `{isAdmin && ...}` ile sarıldı — sadece Admin ve SuperAdmin görür
- Yeni Kullanıcı butonu: `display: isAdmin ? 'inline-flex' : 'none'` ile gizlendi

#### 6. `src/pages/Kunden.jsx`
- `usePermission` import edildi, `canCreate`, `canEdit`, `canDelete` kullanıldı
- Yeni, Düzenle, Sil butonları `{canCreate && ...}`, `{canEdit && ...}`, `{canDelete && ...}` ile sarıldı — NurLesen göremez

#### 7. `src/pages/Projekte.jsx`
- `usePermission` import edildi, `canCreate`, `canEdit`, `canDelete` kullanıldı
- Yeni, Düzenle, Sil butonları rol bazlı gizlendi — NurLesen göremez

#### 8. `src/pages/Tickets.jsx`
- `usePermission` import edildi, `canCreate`, `canEdit`, `canDelete` kullanıldı
- Yeni, Düzenle, Sil butonları rol bazlı gizlendi — NurLesen göremez
- Eye (detay) butonu her zaman görünür

#### 9. `src/pages/Berichte.jsx`
- `usePermission` import edildi, `canCreate`, `canDelete` kullanıldı
- Yükle ve Sil butonları rol bazlı gizlendi — NurLesen göremez
- İndir (download) butonu her zaman görünür

---

### Sonuç Durumu

| Kontrol | Durum |
|---|:---:|
| Login koruması | ✅ |
| `/benutzer` — Sadece Admin & SuperAdmin | ✅ |
| Sidebar Benutzer menüsü gizleme | ✅ |
| Benutzer Düzenle/Sil butonları | ✅ |
| Kunden/Projekte/Tickets/Berichte NurLesen kısıtı | ✅ |
| `usePermission` hook | ✅ |
| Sıfır derleme hatası | ✅ |

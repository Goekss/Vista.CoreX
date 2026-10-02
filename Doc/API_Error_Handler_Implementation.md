# API Error Handler Standardizasyon — Pilot Uygulaması

**Tarih:** 24 Nisan 2026  
**Modül (Pilot):** Benutzer (Kullanıcı Yönetimi)  
**Status:** ✅ Tamamlandı  

---

## 📋 Özet

Saas.CoreX projesinin API hata yönetimi standardize edilmiştir. Mevcut yapıda hata parse'i ve field-specific error mapping eksikti. Bu rapor, uygulanmış çözümü ve diğer modüllere adaptasyon rehberini içerir.

---

## 🎯 Hedefler

| Hedef | Durum |
|-------|-------|
| Ortak API error handler sınıfı | ✅ Yapıldı |
| Field-specific error mapping | ✅ Yapıldı |
| Benutzer modulü pilot refactor | ✅ Yapıldı |
| Form validation feedback | ✅ Yapıldı |
| Dokumentasyon | ✅ Yapıldı |

---

## 📂 Oluşturulan/Güncellenmiş Dosyalar

### 1. **Yeni: `src/api/errorHandler.js`**

Tüm API hatalarını standart şekilde handle eden sınıf ve fonksiyonlar.

**Ana Bileşenler:**

#### `ApiError` Sınıfı
```javascript
class ApiError extends Error {
  constructor(status, message, fieldErrors = {}, originalError = null)
  
  Methods:
  - hasFieldError(fieldName): boolean
  - getFieldError(fieldName): string | null
  - isValidationError(): boolean
  - isUnauthorized(): boolean
  - isForbidden(): boolean
  - isNotFound(): boolean
  - isServerError(): boolean
}
```

**Özellikleri:**
- `status`: HTTP status kodu (0-599)
- `message`: Global error mesajı
- `fieldErrors`: `{ fieldName: "error" }` veya `{ fieldName: ["error1", "error2"] }`
- `originalError`: Original Axios error

#### `parseApiError(axiosError)` Fonksiyonu
Backend response'unu parse ederek ApiError oluşturur.

**Desteklenen Backend Formatları:**

```json
// Format 1: errors alanı
{
  "message": "Validasyon hatası",
  "errors": {
    "vorname": "Vorname ist erforderlich",
    "email": ["Format invalid", "Bereits vorhanden"]
  }
}

// Format 2: fehler alanı (Deutsch)
{
  "title": "Fehler",
  "fehler": {
    "passwort": "Zu kurz"
  }
}

// Format 3: fieldErrors alanı
{
  "fieldErrors": {
    "telefon": "Format ungültig"
  }
}

// Format 4: Sadece message
{
  "message": "Erişim reddedildi"
}
```

#### `normalizeErrorForLogging(error)` Fonksiyonu
axiosClient.js uyumluluğu için error normalizasyonu (optional).

#### `handleApiError(error)` Helper
Tüm error tiplerini handle eder:
- Axios errors → `parseApiError()`
- Diğer errors → Generic ApiError

---

### 2. **Güncellenmiş: `src/api/benutzerApi.js`**

Her API fonksiyonu `async` + `try-catch` pattern'i ile yazılmıştır.

```javascript
// Örnek: getAll
getAll: async (page = 1, size = 20, search = '') => {
  try {
    return await axiosClient.get('/benutzer', { params: { page, size, search } });
  } catch (error) {
    throw handleApiError(error);
  }
}
```

**Değişiklikler:**
- ✅ Promise-based → Async/await
- ✅ Error handling: `handleApiError(error)` ile standardize
- ✅ JSDoc yorumlar (@param, @throws, @deprecated vb.)
- ✅ Type hints (optional)

---

### 3. **Refactored: `src/pages/Benutzer.jsx`**

#### State Yönetimi
```javascript
const [fieldErrors, setFieldErrors] = useState({});
const [saveError, setSaveError] = useState('');
```

#### Form Submit Handler
```javascript
const submit = async (e) => {
  e.preventDefault();
  setSaveError('');
  setFieldErrors({});
  try {
    await onSave(cleaned);
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.message) setSaveError(err.message);
      if (Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
      }
    } else {
      setSaveError('Speichern fehlgeschlagen');
    }
  }
};
```

#### Form Input Error Feedback
```javascript
<Form.Control
  required
  isInvalid={!!fieldErrors.email}
  value={form.email}
  onChange={(e) => setForm({ ...form, email: e.target.value })}
/>
{fieldErrors.email && (
  <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
    {getFieldError('email')}
  </Form.Control.Feedback>
)}
```

**Bootstrap Integration:**
- `isInvalid={condition}` → Input border kırmızı
- `Form.Control.Feedback` → Error mesajı görüntüsü

#### Helper Fonksiyon
```javascript
const getFieldError = (fieldName) => {
  const error = fieldErrors[fieldName];
  if (!error) return null;
  return Array.isArray(error) ? error[0] : error;
};
```

**Diğer Güncellemeler:**
- ApiError import
- Load, Delete, Avatar upload/delete handlers'da ApiError handling
- t() fonksiyonuna `[t]` dependency (useCallback'te)

---

## 🔄 Implementasyon Pattern

Tüm API modülleri (`kundeApi.js`, `ticketApi.js`, vb.) aynı pattern ile güncellenir:

### Step 1: API Dosyasını Update Et

```javascript
import { handleApiError } from './errorHandler';

export const kundeApi = {
  getAll: async (params) => {
    try {
      return await axiosClient.get('/kunden', { params });
    } catch (error) {
      throw handleApiError(error);
    }
  },
  // ... diğer endpoints
};
```

### Step 2: Page Dosyasını Refactor Et

```javascript
import { ApiError } from '../api/errorHandler';

// State'e fieldErrors ekle
const [fieldErrors, setFieldErrors] = useState({});

// Error handler'ı güncelle
const submit = async (e) => {
  try {
    await kundeApi.create(data);
  } catch (err) {
    if (err instanceof ApiError) {
      setSaveError(err.message);
      setFieldErrors(err.fieldErrors);
    }
  }
};
```

### Step 3: Form Input'larını Güncelle

```javascript
<Form.Control
  isInvalid={!!fieldErrors.fieldName}
  // ... diğer props
/>
{fieldErrors.fieldName && (
  <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
    {getFieldError('fieldName')}
  </Form.Control.Feedback>
)}
```

---

## 🧪 Test Senaryoları

### 1. Validasyon Hatası (400/422)
**İstek:** Boş "vorname" ile POST /benutzer  
**Beklenen Response:**
```json
{
  "message": "Validasyon hatası",
  "errors": {
    "vorname": "Vorname ist erforderlich"
  }
}
```
**Beklenen UI:**
- Input field kırmızı border
- Error mesajı gösterilir
- Form kaydetme devre dışı

### 2. Kimlik Doğrulama Hatası (401)
**Beklenen Mesaj:** "Kimlik doğrulama gerekli"  
**Aksiyon:** Login sayfasına yönlendir (AuthProvider tarafından handle edilir)

### 3. Yetkilendirme Hatası (403)
**Beklenen Mesaj:** "Erişim reddedildi"  
**Aksiyon:** Sayfada alert göster, silme/düzenleme devre dışı

### 4. Kaynak Bulunamadı (404)
**İstek:** Var olmayan kullanıcı düzenleme  
**Beklenen Mesaj:** "Kaynak bulunamadı"

### 5. Sunucu Hatası (500)
**Beklenen Mesaj:** "Sunucu hatası (500)"  
**Aksiyon:** Alert göster, retry seçeneği

### 6. Network Hatası
**Senaryo:** Internet kesintisi  
**Beklenen Mesaj:** "Ağ hatası: Sunucuya bağlanılamadı"

---

## 📊 Hata Akışı Diyagramı

```
Axios Request
    ↓
Response/Error
    ↓
axiosClient Interceptor (normalizeError)
    ↓
API Fonksiyonu (handleApiError)
    ↓
ApiError Instance
    ↓
Component Try-Catch
    ├─ Global Error → Alert/Toast
    └─ Field Errors → Input Feedback
```

---

## 🎨 Tasarım Kararları

### Neden ApiError Sınıfı?
- Type safety: `err instanceof ApiError` kontrolü
- Standardizasyon: Tüm API hataları aynı interface
- Extensibility: Yeni methods eklemesi kolay

### Neden Field-Specific Errors?
- UX: Kullanıcı hangi field'da hata olduğunu hemen görür
- Accessibility: Screen readers için daha iyi
- Validation: Backend'in frontend'e validasyon kuralları iletişi

### Neden `fieldErrors` State'i?
- Local: Her form kendi hataları tutar
- Reactive: React render cycle'ı doğru şekilde çalışır
- Cleanup: Form reset'te otomatik temizlenir

---

## ⚠️ Dikkat Edilecek Noktalar

### 1. Backend Response Format
Backend'in standardize bir hata format'ı dönmesi önemli:
```json
{
  "message": "...",
  "errors": { "fieldName": "..." }
}
```

Eğer farklı format'lar varsa, `parseApiError()` fonksiyonuna fallback kuralı eklenmiştir.

### 2. Field Adı Eşleşmesi
Backend'deki field adı (örn. `vorname`) ile Frontend'deki state key'i aynı olmalı:
```javascript
// ✅ Doğru
backend: { errors: { vorname: "..." } }
state: { vorname: "" }

// ❌ Yanlış
backend: { errors: { firstName: "..." } }
state: { vorname: "" } // → Error mapping olmaz
```

### 3. Bileşik Hatalar
Bazı field'lar birden fazla error döndürebilir (array):
```javascript
"email": ["Format invalid", "Bereits vorhanden"]
```
`getFieldError()` fonksiyonu ilkini seçer. Tüm hataları görmek için:
```javascript
{Array.isArray(fieldErrors.email) && (
  <ul className="text-danger">
    {fieldErrors.email.map((err, i) => <li key={i}>{err}</li>)}
  </ul>
)}
```

### 4. Kullanıcı Deneyimi
- Error messageları kullanıcı dostu olmalı (developer değil)
- Türkçe mesajlar tercih edilmeli (backend'ten)
- Loading state'i sırasında hatalar gösterilmemeli

---

## 📝 Implementasyon Checklist

### Benutzer (Pilot) ✅
- [x] errorHandler.js oluştur
- [x] benutzerApi.js refactor
- [x] Benutzer.jsx güncelle
- [x] Test senaryoları tanımla

### Kunden (Sonraki)
- [ ] kundeApi.js refactor
- [ ] Kunden.jsx güncelle
- [ ] Form validasyon testi

### Tickets
- [ ] ticketApi.js refactor
- [ ] Tickets.jsx güncelle

### Projekte
- [ ] projektApi.js refactor
- [ ] Projekte.jsx güncelle

### Diğer Moduller
- [ ] Chat, Berichte, Ansprechpartner vb.

---

## 🚀 İleri Adımlar (Opsiyonel)

### 1. React Hook Form Entegrasyonu
Form validation'ı daha güçlü hale getirmek için:
```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  vorname: z.string().min(1, "Vorname ist erforderlich"),
  email: z.string().email("Email format ungültig"),
});

const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
```

### 2. Toast Notification Sistemi
Global alert yerine, `react-toastify` kullan:
```javascript
import { toast } from 'react-toastify';

toast.error(err.message, { position: 'top-right', autoClose: 3000 });
```

### 3. Backend Entegrasyon Protokolü
Backend team'i ile üzerinde anlaş:
```json
// STANDART RESPONSE FORMAT
{
  "status": "success" | "error" | "validation",
  "message": "User friendly message",
  "data": { ... },
  "errors": {
    "fieldName": "Error message",
    "fieldName": ["Error1", "Error2"]
  }
}
```

### 4. Error Logging & Monitoring
Production'da hata logging'i:
```javascript
if (err.isServerError()) {
  logErrorToService(err); // Sentry, LogRocket, vb.
}
```

---

## 📚 Referanslar

- [MDN - Error Handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Bootstrap Form Validation](https://getbootstrap.com/docs/5.3/forms/validation/)
- [Axios Error Handling](https://axios-http.com/docs/handling_errors)

---

## 📞 Sorular & Notlar

**Q:** Field error'u varsa, global error de gösterilir mi?  
**A:** Hayır. Global error yoksa, field error'unun ilkincisi (varsa) kullanılır.

**Q:** Bütün field'lar hata döndürse ne olur?  
**A:** `fieldErrors` state'inde tümü saklanır, form input'larında kırmızı border + Feedback gösterilir.

**Q:** API response format'ı farklı ise?  
**A:** `parseApiError()` fonksiyonunda fallback kuralları vardır. Backend'in standardize format'ı dönmesi tercih edilir.

---

**Son Güncelleme:** 24 Nisan 2026  
**Sonraki Review:** API Standardizasyon Phase 2 (Kunden + Tickets)

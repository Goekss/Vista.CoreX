# 🎨 Frontend Entegrasyonu - Dosya Yükleme

## 📋 Genel Bakış

Backend'de hazırladığımız dosya yükleme sistemini React frontend'inde kullanmak için bu rehberi takip edin.

---

## 🚀 1. React Component (Logo Upload)

### **KundeLogoUploader.jsx**

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8080'; // Backend URL'iniz

const KundeLogoUploader = ({ kundeId, currentLogo, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(currentLogo || '');

  // Dosya seçildiğinde
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    // Validasyon: Format kontrolü
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Sadece PNG, JPEG, JPG formatları desteklenir');
      return;
    }

    // Validasyon: Boyut kontrolü (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (selectedFile.size > maxSize) {
      setError('Dosya boyutu 5MB\'dan küçük olmalı');
      return;
    }

    setFile(selectedFile);
    setError('');

    // Preview oluştur
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Yükleme işlemi
  const handleUpload = async () => {
    if (!file) {
      setError('Lütfen bir dosya seçin');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('logoFile', file);

      // Token'ı localStorage'dan al (veya state'ten)
      const token = localStorage.getItem('accessToken');

      const response = await axios.post(
        `${API_URL}/api/kunde/${kundeId}/upload-logo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      // Başarılı
      console.log('Logo yüklendi:', response.data);
      setPreview(`${API_URL}${response.data.logo}`);

      // Parent component'e bildir
      if (onUploadSuccess) {
        onUploadSuccess(response.data.logo);
      }

      setFile(null);
    } catch (err) {
      console.error('Upload hatası:', err);
      setError(err.response?.data?.nachricht || 'Logo yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  // Logo silme işlemi
  const handleDelete = async () => {
    if (!window.confirm('Logoyu silmek istediğinize emin misiniz?')) return;

    try {
      const token = localStorage.getItem('accessToken');

      await axios.delete(
        `${API_URL}/api/kunde/${kundeId}/delete-logo`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      setPreview('');
      setFile(null);

      if (onUploadSuccess) {
        onUploadSuccess('');
      }
    } catch (err) {
      console.error('Silme hatası:', err);
      setError('Logo silinirken hata oluştu');
    }
  };

  return (
    <div className="logo-uploader">
      <h3>Müşteri Logosu</h3>

      {/* Preview */}
      {preview && (
        <div className="preview">
          <img 
            src={preview} 
            alt="Logo" 
            style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
          />
          <button onClick={handleDelete} className="btn-delete">
            Logoyu Sil
          </button>
        </div>
      )}

      {/* Upload Form */}
      <div className="upload-form">
        <input
          type="file"
          accept=".png,.jpg,.jpeg"
          onChange={handleFileChange}
          disabled={uploading}
        />

        {file && (
          <button 
            onClick={handleUpload} 
            disabled={uploading}
            className="btn-upload"
          >
            {uploading ? 'Yükleniyor...' : 'Logoyu Yükle'}
          </button>
        )}
      </div>

      {/* Hata Mesajı */}
      {error && <div className="error">{error}</div>}

      {/* Bilgi */}
      <small>PNG, JPEG, JPG - Max 5MB</small>
    </div>
  );
};

export default KundeLogoUploader;
```

---

## 🖼️ 2. Kullanıcı Avatar Uploader

### **BenutzerAvatarUploader.jsx**

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8080';

const BenutzerAvatarUploader = ({ benutzerId, currentAvatar, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(currentAvatar || '');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Sadece PNG, JPEG, JPG formatları desteklenir');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('Dosya boyutu 5MB\'dan küçük olmalı');
      return;
    }

    setFile(selectedFile);
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Lütfen bir dosya seçin');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('avatarFile', file); // ← KEY: 'avatarFile'

      const token = localStorage.getItem('accessToken');

      const response = await axios.post(
        `${API_URL}/api/benutzer/${benutzerId}/upload-avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('Avatar yüklendi:', response.data);
      setPreview(`${API_URL}${response.data.avatar}`);

      if (onUploadSuccess) {
        onUploadSuccess(response.data.avatar);
      }

      setFile(null);
    } catch (err) {
      console.error('Upload hatası:', err);
      setError(err.response?.data?.nachricht || 'Avatar yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Avatarı silmek istediğinize emin misiniz?')) return;

    try {
      const token = localStorage.getItem('accessToken');

      await axios.delete(
        `${API_URL}/api/benutzer/${benutzerId}/delete-avatar`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      setPreview('');
      setFile(null);

      if (onUploadSuccess) {
        onUploadSuccess('');
      }
    } catch (err) {
      console.error('Silme hatası:', err);
      setError('Avatar silinirken hata oluştu');
    }
  };

  return (
    <div className="avatar-uploader">
      <h3>Kullanıcı Avatarı</h3>

      {preview && (
        <div className="preview">
          <img 
            src={preview} 
            alt="Avatar" 
            style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              objectFit: 'cover' 
            }}
          />
          <button onClick={handleDelete}>Avatarı Sil</button>
        </div>
      )}

      <div className="upload-form">
        <input
          type="file"
          accept=".png,.jpg,.jpeg"
          onChange={handleFileChange}
          disabled={uploading}
        />

        {file && (
          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Yükleniyor...' : 'Avatarı Yükle'}
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}
      <small>PNG, JPEG, JPG - Max 5MB</small>
    </div>
  );
};

export default BenutzerAvatarUploader;
```

---

## 📦 3. API Service (Axios)

### **api/fileService.js**

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:8080';

// Axios instance (token otomatik ekleme)
const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Müşteri Logo İşlemleri
export const uploadKundeLogo = async (kundeId, file) => {
  const formData = new FormData();
  formData.append('logoFile', file);

  const response = await apiClient.post(
    `/api/kunde/${kundeId}/upload-logo`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );

  return response.data;
};

export const deleteKundeLogo = async (kundeId) => {
  const response = await apiClient.delete(`/api/kunde/${kundeId}/delete-logo`);
  return response.data;
};

// Kullanıcı Avatar İşlemleri
export const uploadBenutzerAvatar = async (benutzerId, file) => {
  const formData = new FormData();
  formData.append('avatarFile', file);

  const response = await apiClient.post(
    `/api/benutzer/${benutzerId}/upload-avatar`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );

  return response.data;
};

export const deleteBenutzerAvatar = async (benutzerId) => {
  const response = await apiClient.delete(`/api/benutzer/${benutzerId}/delete-avatar`);
  return response.data;
};
```

### **Kullanım:**

```jsx
import { uploadKundeLogo, deleteKundeLogo } from './api/fileService';

// Component içinde:
const handleUpload = async (file) => {
  try {
    const data = await uploadKundeLogo(kundeId, file);
    console.log('Yüklendi:', data.logo);
  } catch (error) {
    console.error('Hata:', error.response?.data?.nachricht);
  }
};
```

---

## 🎯 4. Basit Form Örneği (Vanilla JS)

HTML:

```html
<form id="logoUploadForm">
  <input type="file" id="logoFile" accept=".png,.jpg,.jpeg" required />
  <button type="submit">Yükle</button>
</form>

<div id="result"></div>
<img id="preview" style="max-width: 200px; display: none;" />
```

JavaScript:

```javascript
const API_URL = 'http://localhost:8080';
const kundeId = 'abc-123-456'; // Müşteri ID'si
const token = 'your-jwt-token'; // Login'den aldığınız token

document.getElementById('logoUploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById('logoFile');
  const file = fileInput.files[0];

  if (!file) {
    alert('Lütfen bir dosya seçin');
    return;
  }

  // FormData oluştur
  const formData = new FormData();
  formData.append('logoFile', file);

  try {
    const response = await fetch(`${API_URL}/api/kunde/${kundeId}/upload-logo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData, // ← Content-Type otomatik ayarlanır
    });

    if (!response.ok) {
      throw new Error('Upload hatası');
    }

    const data = await response.json();
    console.log('Başarılı:', data);

    // Göster
    document.getElementById('result').textContent = 'Logo yüklendi!';
    document.getElementById('preview').src = `${API_URL}${data.logo}`;
    document.getElementById('preview').style.display = 'block';
  } catch (error) {
    console.error('Hata:', error);
    alert('Logo yüklenirken hata oluştu');
  }
});
```

---

## 🔑 5. Önemli Noktalar

### ✅ FormData Key'leri:

| Backend Endpoint | FormData Key |
|-----------------|--------------|
| `/api/kunde/{id}/upload-logo` | `logoFile` |
| `/api/benutzer/{id}/upload-avatar` | `avatarFile` |

**Örnek:**
```javascript
// ✅ DOĞRU
formData.append('logoFile', file);

// ❌ YANLIŞ
formData.append('file', file);
formData.append('logo', file);
```

### 🔐 Authorization Header:

```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

**Token nereden gelir?**
- Login yaptıktan sonra backend'den dönen `accessToken`
- Cookie'den veya localStorage'dan alınır

### 🖼️ Image Preview:

Backend'den dönen URL:

```json
{
  "logo": "/storage/Logos/abc-123-1234567890.png"
}
```

Frontend'de göstermek için:

```jsx
<img src={`${API_URL}${kunde.logo}`} alt="Logo" />
```

**Tam URL:** `http://localhost:8080/storage/Logos/abc-123-1234567890.png`

---

## 🧪 6. Test (Postman/Thunder Client)

### **Logo Yükle:**

```
POST http://localhost:8080/api/kunde/{kundeId}/upload-logo

Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Body (form-data):
  Key: logoFile
  Value: [dosya seç]
```

### **Response:**

```json
{
  "logo": "/storage/Logos/abc-123-1234567890.png",
  "nachricht": "Logo başarıyla yüklendi."
}
```

---

## 🎨 7. CSS (Opsiyonel)

```css
.logo-uploader {
  max-width: 400px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.preview {
  margin-bottom: 20px;
  text-align: center;
}

.preview img {
  border: 2px solid #eee;
  border-radius: 4px;
  margin-bottom: 10px;
}

.btn-delete {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-upload {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.error {
  color: #dc3545;
  margin-top: 10px;
  font-size: 14px;
}

input[type="file"] {
  margin-top: 10px;
}
```

---

## 🚀 8. Hızlı Başlangıç

### **Adım 1:** Backend'i Çalıştır

```bash
cd Vista.Core
dotnet run
```

### **Adım 2:** Frontend'de Axios Kur

```bash
npm install axios
```

### **Adım 3:** Component'i Ekle

```jsx
import KundeLogoUploader from './components/KundeLogoUploader';

function KundePage() {
  const [kunde, setKunde] = useState(null);

  return (
    <div>
      <h1>Müşteri Detayları</h1>

      <KundeLogoUploader
        kundeId={kunde.id}
        currentLogo={kunde.logo}
        onUploadSuccess={(newLogo) => {
          setKunde({ ...kunde, logo: newLogo });
        }}
      />
    </div>
  );
}
```

---

## ❓ Sık Sorulan Sorular

### **1. "422 Unprocessable Entity" Hatası**

**Neden:** FormData key'i yanlış.

**Çözüm:**
```javascript
// ✅ DOĞRU
formData.append('logoFile', file);

// ❌ YANLIŞ
formData.append('file', file);
```

### **2. "401 Unauthorized" Hatası**

**Neden:** Token eksik veya geçersiz.

**Çözüm:**
```javascript
// Token'ı doğru ekle
headers: {
  'Authorization': `Bearer ${token}`
}
```

### **3. "400 Bad Request - Dosya boyutu çok büyük"**

**Neden:** Dosya 5MB'dan büyük.

**Çözüm:** Frontend'de boyut kontrolü ekle:

```javascript
if (file.size > 5 * 1024 * 1024) {
  alert('Dosya 5MB\'dan küçük olmalı');
  return;
}
```

### **4. CORS Hatası**

**Neden:** Backend CORS ayarları eksik.

**Çözüm:** `Program.cs`'te zaten var:

```csharp
builder.Services.AddCors(opt => opt.AddPolicy("ReactApp",
    p => p.WithOrigins("http://localhost:5173")
          .AllowAnyMethod()
          .AllowAnyHeader()
          .AllowCredentials()));
```

Frontend URL'ini güncelle: `http://localhost:5173`

---

## 📚 Kaynak Kodlar

Tüm örnekler bu dosyada! Copy-paste yapabilirsiniz.

**Sorular için:** GitHub Issues

---

✅ **Hazır!** Artık frontend'den dosya yükleyebilirsin.

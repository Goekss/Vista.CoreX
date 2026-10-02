🔴 Frontend Eksikler Raporu — Saas.CoreX
Kaynak: Vista.Core Backend taraması
Tarih: 2026-04-28
Hedef: Frontend ekibine verilecek görev listesi

1. EKSİK SAYFALAR
Eksik Sayfa	Backend Controller	Açıklama
Abonnement.jsx	AbonnementController.cs	Abonelik yönetimi sayfası yok
Zahlung.jsx	ZahlungController.cs	Ödeme/IBAN yönetimi sayfası yok
Rechnung.jsx	Rechnung.cs (model)	Fatura sayfası yok (controller da yok ama model var)
TicketDetail.jsx	TicketNachrichtController.cs	Ticket mesajlaşma (timeline) için ayrı detail sayfası yok
Filiale.jsx	Filiale.cs (model)	Şube yönetimi sayfası yok
2. EKSİK API DOSYALARI
Eksik API	Backend Endpoint	Mevcut Durum
abonnementApi.js	api/abonnement/*	❌ Yok
zahlungApi.js	api/zahlung/*	❌ Yok
ticketNachrichtApi.js	api/ticketnachricht/*	❌ Yok
ℹ️ filialeApi.js frontend'de var ama backend'de FilialeController YOK. Backend'e de eklenmeli veya frontend'den kaldırılmalı.

3. EKSİK ENDPOINT ENTEGRASYONLARI
AuthController — Eksik Frontend Entegrasyonları
Endpoint	Route	Frontend Durumu
GET /api/auth/me	Mevcut kullanıcı bilgisi	⚠️ Kontrol et — useAuth'da kullanılıyor mu?
GET /api/auth/locked-users	Kilitli kullanıcı listesi	❌ Admin panelinde yok
POST /api/auth/unlock/{email}	Kullanıcı kilidini aç	❌ Admin panelinde yok
KundeController — Eksik Frontend Entegrasyonları
Endpoint	Route	Frontend Durumu
POST /api/kunde/{id}/upload-logo	Müşteri logo yükleme	⚠️ Kontrol et
DELETE /api/kunde/{id}/delete-logo	Müşteri logo silme	⚠️ Kontrol et
BenutzerController — Eksik Frontend Entegrasyonları
Endpoint	Route	Frontend Durumu
POST /api/benutzer/{id}/upload-avatar	Profil resmi yükleme	⚠️ Kontrol et
DELETE /api/benutzer/{id}/delete-avatar	Profil resmi silme	⚠️ Kontrol et
BerichtController — Eksik Frontend Entegrasyonları
Endpoint	Route	Frontend Durumu
GET /api/bericht/{id}/download	Dosya indirme	⚠️ Kontrol et
ProjektController — Eksik Frontend Entegrasyonları
Endpoint	Route	Frontend Durumu
PUT /api/projekt/{id}/benutzer	Projeye personel atama	⚠️ Kontrol et
AbonnementController — TÜM ENDPOINTLERİ EKSİK
Endpoint	Route
GET /api/abonnement	Liste
GET /api/abonnement/{id}	Detay
POST /api/abonnement	Oluştur
PUT /api/abonnement/{id}	Güncelle
DELETE /api/abonnement/{id}	Sil
GET /api/abonnement/plaene	Plan listesi
ZahlungController — TÜM ENDPOINTLERİ EKSİK
Endpoint	Route
GET /api/zahlung	Liste
GET /api/zahlung/{id}	Detay
POST /api/zahlung	Oluştur
PATCH /api/zahlung/{id}/status	Durum güncelle
TicketNachrichtController — TÜM ENDPOINTLERİ EKSİK
Endpoint	Route
GET /api/ticketnachricht/ticket/{ticketId}	Ticket mesajları listele
POST /api/ticketnachricht	Mesaj gönder
4. EKSİK BILEŞENLER (Önerilen)
Bileşen	Kullanım Alanı
TicketTimeline.jsx	Ticket detay sayfasında mesaj geçmişi
TicketNachrichtForm.jsx	Ticket'a mesaj/not ekleme formu
FileUpload.jsx	Logo, avatar, rapor dosyası upload (ortak)
FileDownload.jsx	Bericht dosya indirme butonu
LockUnlockUser.jsx	Admin → kilitli kullanıcı yönetimi
AbonnementKarte.jsx	Abonelik plan kartı
ZahlungTabelle.jsx	Ödeme geçmişi tablosu
FilialeForm.jsx	Şube ekleme/düzenleme (backend controller da lazım)
5. SIGNALR HUB ENTEGRASYONLARI
Hub	Route	Frontend Hook	Durum
ChatHub	/hubs/chat	useSignalR.js	✅ Var
BenachrichtigungHub	/hubs/benachrichtigung	?	⚠️ Bildirim hook'u kontrol et
6. MODEL/BACKEND UYUMSUZLUKLARI
Durum	Detay
⚠️ filialeApi.js var	Backend'de FilialeController yok — ya backend'e controller ekle ya frontend'den kaldır
⚠️ Rechnung.cs model var	Ama RechnungController yok — taslak modül, ileride eklenecek
📊 ÖZET
Kategori	Eksik Sayısı
Eksik Sayfalar	5
Eksik API Dosyaları	3
Eksik Endpoint Entegrasyonları	~18
Eksik Bileşenler (önerilen)	8
Hub Kontrol	1
Uyumsuzluklar	2
Öncelik Sırası:

ticketNachrichtApi.js + TicketDetail.jsx (kullanıcı deneyimi için kritik)
Locked-user yönetimi (güvenlik)
Dosya upload/download entegrasyonları
Abonnement + Zahlung (taslak modül — düşük öncelik)
Filiale backend/frontend uyumu

---

# 🔍 FRONTEND TESPİT VE ANALİZ

> **Tarih:** 2026-04-28  
> **Yöntem:** Mevcut `src/` dizin yapısı taranarak `sonkontrol.md` ile birebir karşılaştırıldı.

---

## 1. EKSİK SAYFALAR — Doğrulama

| Sayfa | sonkontrol.md | Gerçek Durum | Sonuç |
|-------|--------------|--------------|-------|
| Abonnement.jsx | ❌ Eksik | `src/pages/` içinde **YOK** | ❌ DOĞRU — Eksik |
| Zahlung.jsx | ❌ Eksik | `src/pages/` içinde **YOK** | ❌ DOĞRU — Eksik |
| Rechnung.jsx | ❌ Eksik | `src/pages/` içinde **YOK** | ❌ DOĞRU — Eksik |
| TicketDetail.jsx | ❌ Eksik | `src/pages/` içinde **YOK** | ❌ DOĞRU — Eksik |
| Filiale.jsx | ❌ Eksik | `src/pages/` içinde **YOK** | ❌ DOĞRU — Eksik |

**Mevcut sayfalar (9):** Login, ZweiFaktor, Dashboard, Kunden, Projekte, Tickets, Chat, Benutzer, Berichte

---

## 2. EKSİK API DOSYALARI — Doğrulama

| API Dosyası | sonkontrol.md | Gerçek Durum | Sonuç |
|-------------|--------------|--------------|-------|
| abonnementApi.js | ❌ Yok | `src/api/` içinde **YOK** | ❌ DOĞRU — Eksik |
| zahlungApi.js | ❌ Yok | `src/api/` içinde **YOK** | ❌ DOĞRU — Eksik |
| ticketNachrichtApi.js | ❌ Yok | `src/api/` içinde **YOK** | ⚠️ KISMEN — `ticketApi.js` içinde `getNachrichten` ve `addNachricht` mevcut |
| filialeApi.js | ⚠️ Var ama backend yok | `src/api/filialeApi.js` **MEVCUT** (669 byte) | ⚠️ DOĞRU — API var, backend controller yok |

**Mevcut API dosyaları (12):** axiosClient, errorHandler, authApi, benutzerApi, berichtApi, chatApi, dashboardApi, kundeApi, projektApi, ticketApi, filialeApi, ansprechpartnerApi

---

## 3. ENDPOINT ENTEGRASYONLARI — Doğrulama

### AuthController
| Endpoint | API Dosyası | Sayfa Kullanımı | Sonuç |
|----------|------------|----------------|-------|
| GET /api/auth/me | ✅ `authApi.me()` MEVCUT | ❌ useAuth'da çağrılmıyor | ⚠️ API var, hook'ta kullanılmıyor |
| GET /api/auth/locked-users | ❌ authApi'da YOK | ❌ Hiçbir sayfada yok | ❌ Tamamen eksik |
| POST /api/auth/unlock/{email} | ❌ authApi'da YOK | ❌ Hiçbir sayfada yok | ❌ Tamamen eksik |

### KundeController
| Endpoint | API Dosyası | Sayfa Kullanımı | Sonuç |
|----------|------------|----------------|-------|
| POST /kunde/{id}/upload-logo | ✅ `kundeApi.uploadLogo()` MEVCUT | ✅ Kunden.jsx KundeModal içinde kullanılıyor | ✅ TAMAMLANMIŞ |
| DELETE /kunde/{id}/delete-logo | ✅ `kundeApi.deleteLogo()` MEVCUT | ✅ Kunden.jsx KundeModal içinde kullanılıyor | ✅ TAMAMLANMIŞ |

### BenutzerController
| Endpoint | API Dosyası | Sayfa Kullanımı | Sonuç |
|----------|------------|----------------|-------|
| POST /benutzer/{id}/upload-avatar | ✅ `benutzerApi.uploadAvatar()` MEVCUT | ❌ Benutzer.jsx'te çağrılmıyor | ⚠️ API var, UI entegrasyonu yok |
| DELETE /benutzer/{id}/delete-avatar | ✅ `benutzerApi.deleteAvatar()` MEVCUT | ❌ Benutzer.jsx'te çağrılmıyor | ⚠️ API var, UI entegrasyonu yok |

### BerichtController
| Endpoint | API Dosyası | Sayfa Kullanımı | Sonuç |
|----------|------------|----------------|-------|
| GET /bericht/{id}/download | ✅ `berichtApi.download()` MEVCUT | ✅ Berichte.jsx'te `handleDownload` ve `handleView` ile kullanılıyor | ✅ TAMAMLANMIŞ |

### ProjektController
| Endpoint | API Dosyası | Sayfa Kullanımı | Sonuç |
|----------|------------|----------------|-------|
| POST /projekt/{id}/benutzer | ✅ `projektApi.assignBenutzer()` MEVCUT | ✅ Projekte.jsx handleSave içinde kullanılıyor | ✅ TAMAMLANMIŞ |
| DELETE /projekt/{id}/benutzer/{id} | ✅ `projektApi.removeBenutzer()` MEVCUT | ⚠️ Remove henüz UI'da yok ama assign çalışıyor | ⚠️ Kısmi |

### AbonnementController — TÜM ENDPOINTLERİ
| Durum | Detay |
|-------|-------|
| API Dosyası | ❌ abonnementApi.js YOK |
| Sayfa | ❌ Abonnement.jsx YOK |
| Route | ❌ App.jsx'te route YOK |

### ZahlungController — TÜM ENDPOINTLERİ
| Durum | Detay |
|-------|-------|
| API Dosyası | ❌ zahlungApi.js YOK |
| Sayfa | ❌ Zahlung.jsx YOK |
| Route | ❌ App.jsx'te route YOK |

### TicketNachrichtController
| Durum | Detay |
|-------|-------|
| API Dosyası | ⚠️ ticketApi.js içinde gömülü (`getNachrichten`, `addNachricht`) |
| Sayfa | ✅ Tickets.jsx içinde `TicketDetail` modal bileşeni olarak MEVCUT — mesaj gönderme + listeleme çalışıyor |
| Not | Ayrı bir TicketDetail.jsx sayfası yok ama modal olarak işlevsel |

---

## 4. EKSİK BİLEŞENLER — Doğrulama

| Bileşen | `src/components/` | Sonuç |
|---------|-------------------|-------|
| TicketTimeline.jsx | ❌ YOK | ❌ Eksik |
| TicketNachrichtForm.jsx | ❌ YOK | ❌ Eksik |
| FileUpload.jsx | ❌ YOK | ❌ Eksik |
| FileDownload.jsx | ❌ YOK | ❌ Eksik |
| LockUnlockUser.jsx | ❌ YOK | ❌ Eksik |
| AbonnementKarte.jsx | ❌ YOK | ❌ Eksik |
| ZahlungTabelle.jsx | ❌ YOK | ❌ Eksik |
| FilialeForm.jsx | ❌ YOK | ❌ Eksik |

**Mevcut shared bileşenler (6):** AppNavbar, ConfirmDialog, DataTable, LoadingSpinner, ProtectedRoute, StatusBadge  
**Mevcut layout bileşenleri (4):** Header, MainLayout, Sidebar, ThemeSettingsPanel

---

## 5. SIGNALR HUB — Doğrulama

| Hub | sonkontrol.md | Gerçek Durum | Sonuç |
|-----|--------------|--------------|-------|
| ChatHub /hubs/chat | ✅ Var | ✅ useSignalR.js MEVCUT | ✅ OK |
| BenachrichtigungHub /hubs/benachrichtigung | ⚠️ Kontrol et | ⚠️ Tickets.jsx'te bağlantı VAR ama genel bildirim hook'u YOK | ⚠️ Kısmi |

---

## 6. ROUTE YAPISI (App.jsx) — Analiz

| Route | Sayfa | Durum |
|-------|-------|-------|
| / | Dashboard | ✅ |
| /login | Login | ✅ |
| /verify | ZweiFaktor | ✅ |
| /kunden | Kunden | ✅ |
| /projekte | Projekte | ✅ |
| /tickets | Tickets | ✅ |
| /chat | Chat | ✅ |
| /benutzer | Benutzer | ✅ (rol korumalı) |
| /berichte | Berichte | ✅ |
| /abonnement | — | ❌ EKSİK |
| /zahlung | — | ❌ EKSİK |
| /filiale | — | ❌ EKSİK |
| /tickets/:id | TicketDetail | ❌ EKSİK |

---

## 7. UYUMSUZLUKLAR — Doğrulama

| Durum | sonkontrol.md | Gerçek Durum | Sonuç |
|-------|--------------|--------------|-------|
| filialeApi.js var, backend yok | ⚠️ | ✅ DOĞRU — filialeApi.js mevcut, Projekte+Kunden'de kullanılıyor | ⚠️ Backend controller şart |
| Rechnung.cs model var, controller yok | ⚠️ | Kontrol dışı (backend) | ⚠️ Taslak modül |

---

## 📊 NİHAİ ÖZET

| Kategori | sonkontrol.md Tespiti | Gerçek Durum | Fark |
|----------|----------------------|--------------|------|
| Eksik Sayfalar | 5 | **3 gerçek eksik** (Abonnement, Zahlung, Filiale) | ⚠️ Rechnung taslak, TicketDetail modal olarak mevcut |
| Eksik API Dosyaları | 3 | **2 tamamen eksik** (abonnement, zahlung) | ⚠️ ticketNachricht ticketApi içinde mevcut |
| Eksik Endpoint Entegrasyonları | ~18 | **~7 UI entegrasyonu eksik** | ✅ Logo, download, ticket mesaj zaten çalışıyor |
| Eksik Bileşenler | 8 | **5 gerçek ihtiyaç** | ⚠️ TicketTimeline/Form modal içinde var, FileDownload Berichte'de var |
| Hub Kontrol | 1 | **1 kısmi** | ✅ Uyumlu |
| Uyumsuzluklar | 2 | **2 — DOĞRULANMIŞ** | ✅ Uyumlu |
| Eksik Route | — | **3 eksik route** (abonnement, zahlung, filiale) | 🆕 Yeni tespit |

### ⚡ GERÇEK EKSİKLER (Uygulama Önceliği)
1. ✅ ~~**Auth → locked-users + unlock**~~ — authApi'ya eklendi + Benutzer.jsx'te LockedUsersPanel eklendi
2. ✅ ~~**Benutzer.jsx → avatar upload/delete UI**~~ — Zaten BenutzerModal içinde entegre (satır 362-451)
3. ✅ ~~**Projekte.jsx → personel atama UI**~~ — Zaten ProjektModal'da assignBenutzer entegre (satır 63-85)
4. ✅ ~~**Abonnement**~~ → abonnementApi.js + Abonnement.jsx oluşturuldu
5. ✅ ~~**Zahlung**~~ → zahlungApi.js + Zahlung.jsx oluşturuldu
6. ✅ ~~**Filiale**~~ → Filiale.jsx oluşturuldu (backend controller geldiğinde çalışacak)
7. ✅ ~~**Sidebar**~~ → Abonnement/Zahlung/Filialen linkleri + 4 dil desteği eklendi
8. ✅ ~~**useAuth**~~ → Zaten `authApi.me()` kullanılıyor (satır 63, 96, 157) — yanlış tespit
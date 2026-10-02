# CRM SaaS — React Frontend Master Plan V2

> **KULLANIM:** Bu plan, Backend API (`Vista.Core plan V2`) ile entegre çalışacak modern bir SPA (Single Page Application) için adım adım geliştirme rehberidir.
> **NOT:** Frontend bağımsız bir projedir. Backend ile sadece API (`http://localhost:8080/api`) üzerinden haberleşir.

---

## 🚀 Tech Stack

| Katman | Seçim | Neden? |
|--------|-------|--------|
| **Core** | Vite + React (Vanilla JS) | Süper hızlı derleyici, sade yapı |
| **Routing** | React Router v6 | SPA sayfa geçişleri + `ProtectedRoute` |
| **Styling** | Bootstrap 5 + Bootstrap Icons (npm) | Hazır component'ler, tablo/modal/badge/pagination |
| **Network** | Axios | Merkezi Interceptor (X-Mandant-Id, 401 refresh, infinite loop koruması) |
| **State** | Context API (AuthContext) | Login durumu, mandantId, kullanıcı bilgisi |
| **Real-time**| `@microsoft/signalr` | Canlı chat ve Ticket bildirimleri |

---

## 📂 Klasör Mimarisi

```text
frontend/
├── src/
│   ├── api/                          # Axios instance + endpoint fonksiyonları
│   │   ├── axiosClient.js            # Interceptor: X-Mandant-Id + 401 refresh + loop fix
│   │   ├── authApi.js                # login, verifyCode, refresh, logout
│   │   ├── kundeApi.js               # Kunde CRUD
│   │   ├── projektApi.js             # Projekt CRUD
│   │   ├── ticketApi.js              # Ticket CRUD
│   │   ├── chatApi.js                # Chat odaları ve mesajlar
│   │   ├── dashboardApi.js           # Dashboard istatistikleri
│   │   └── benutzerApi.js            # Kullanıcı yönetimi (YENİ)
│   │
│   ├── components/
│   │   ├── layout/                   # Sayfa iskeleti
│   │   │   ├── Sidebar.jsx           # Sol menü (YENİ)
│   │   │   ├── Header.jsx            # Üst bar (YENİ)
│   │   │   └── MainLayout.jsx        # Sidebar + Header + Outlet (YENİ)
│   │   ├── shared/                   # Ortak bileşenler
│   │   │   ├── AppNavbar.jsx         # ✅ Mevcut
│   │   │   ├── DataTable.jsx         # ✅ Mevcut
│   │   │   ├── ProtectedRoute.jsx    # ✅ Mevcut
│   │   │   ├── StatusBadge.jsx       # ✅ Mevcut
│   │   │   ├── ConfirmDialog.jsx     # Silme onayı (YENİ)
│   │   │   └── LoadingSpinner.jsx    # Yükleme animasyonu (YENİ)
│   │
│   ├── hooks/
│   │   ├── useAuth.jsx               # ✅ Mevcut — AuthContext + login/logout
│   │   └── useSignalR.js             # ✅ Mevcut — Chat/Bildirim bağlantısı
│   │
│   ├── pages/
│   │   ├── Login.jsx                 # ✅ Mevcut
│   │   ├── ZweiFaktor.jsx            # ✅ Mevcut
│   │   ├── Dashboard.jsx             # ✅ Mevcut (canlı veri bağlantısı yapılacak)
│   │   ├── Kunden.jsx                # ✅ Mevcut
│   │   ├── Projekte.jsx              # ✅ Mevcut
│   │   ├── Tickets.jsx               # ✅ Mevcut
│   │   └── Chat.jsx                  # ✅ Mevcut
│   │
│   ├── App.jsx                       # ✅ Mevcut — Router
│   └── main.jsx                      # ✅ Mevcut — Entry point
│
├── .env                              # VITE_API_BASE_URL=http://localhost:8080/api
├── vite.config.js
└── package.json
```

---

## 🔐 Authentication Akışı

1. `POST /api/auth/login` → email + passwort → 2FA kodu e-posta ile gönderilir
2. `POST /api/auth/verify` → email + code → JWT (httpOnly cookie) + **mandantId** döner
3. Frontend `mandantId`'yi localStorage'a kaydeder
4. `axiosClient.js` her istekte `X-Mandant-Id` header'ı ve cookie'yi otomatik gönderir
5. 401 hatası → `/api/auth/refresh` dener, başarısızsa `/login`'e yönlendirir

> **ÖNEMLİ:** axiosClient.js'de auth endpoint'lerinde refresh denenmez (infinite loop koruması).

---

## 🗺️ FRONTEND UYGULAMA FAZLARI

- [x] **F.1** Vite + React proje kurulumu ✅
- [x] **F.2** Bootstrap 5, Axios, React Router Dom, SignalR yüklendi ✅
- [x] **F.3** `axiosClient.js` (Interceptor + X-Mandant-Id + refresh + loop fix) ✅
- [x] **F.4** `useAuth.jsx` (AuthContext) + `ProtectedRoute.jsx` ✅
- [x] **F.5** Layout: `Sidebar.jsx` + `Header.jsx` + `MainLayout.jsx` → Bootstrap ile modern tasarım ✅
- [x] **F.6** `Login.jsx` + `ZweiFaktor.jsx` (2FA akışı çalışıyor) ✅
- [x] **F.7** `Dashboard.jsx` — API'den canlı istatistik çekme (`/api/dashboard`) ✅
- [x] **F.8** `Kunden.jsx` — CRUD çalışıyor ✅
- [x] **F.9** `Tickets.jsx` — CRUD + SignalR bildirim entegrasyonu ✅
- [x] **F.10** `Chat.jsx` — SignalR canlı mesaj testi ✅
- [x] **F.11** `benutzerApi.js` + Kullanıcı Yönetimi sayfası (YENİ) ✅
- [x] **F.12** UI Polish — Bootstrap Icons, renk paleti, animasyonlar, responsive ✅

---

> **Tasarım Notu:** Portfolyo vitrini olduğu için Bootstrap CSS standart bırakılmayacak; Bootstrap Icons, mikro animasyonlar, temiz buton yuvarlamaları, yumuşak renk paleti ve modern gölgeler (box-shadow) kullanılacaktır.

---

## 🔗 Backend API Endpoint Tablosu

> Frontend'den backend'e yapılacak tüm isteklerin tam listesi.
> Her istekte `X-Mandant-Id` header'ı (Tenant GUID) gönderilmelidir.
> Auth cookie (httpOnly JWT) otomatik gider — `withCredentials: true` yeterli.

### 🔐 Auth

| Metod | Endpoint | Body / Params | Açıklama |
|-------|----------|---------------|----------|
| POST | `/api/auth/login` | `{ email, passwort }` | Giriş → 2FA kod gönderir |
| POST | `/api/auth/verify` | `{ email, code }` | 2FA doğrula → JWT cookie set eder |
| POST | `/api/auth/refresh` | — | Token yenile |
| POST | `/api/auth/logout` | — | Çıkış |

### 👥 Kunde (Müşteri)

| Metod | Endpoint | Body / Params |
|-------|----------|---------------|
| GET | `/api/kunde?page=1&size=20&search=` | Query params |
| GET | `/api/kunde/{id}` | — |
| POST | `/api/kunde` | `{ unternehmen, vorname, nachname, email, telefonMobil, telefonHaus, adresse, website, hinweise }` |
| PUT | `/api/kunde/{id}` | Aynı body |
| DELETE | `/api/kunde/{id}` | — |

### 👤 Ansprechpartner (İletişim Kişisi)

| Metod | Endpoint | Body / Params |
|-------|----------|---------------|
| GET | `/api/ansprechpartner?kundeId=` | Kunde bazlı listeleme |
| POST | `/api/ansprechpartner` | `{ name, telefon, email, abteilung, kundeId }` |
| PUT | `/api/ansprechpartner/{id}` | Aynı body |
| DELETE | `/api/ansprechpartner/{id}` | — |

### 📁 Projekt

| Metod | Endpoint | Body / Params |
|-------|----------|---------------|
| GET | `/api/projekt?page=1&size=20&search=` | Query params |
| GET | `/api/projekt/{id}` | — |
| POST | `/api/projekt` | `{ name, beschreibung, startdatum, enddatum, status, prioritaet, abschlussInProzent }` |
| PUT | `/api/projekt/{id}` | Aynı body |
| DELETE | `/api/projekt/{id}` | — |

### 🎫 Ticket

| Metod | Endpoint | Body / Params |
|-------|----------|---------------|
| GET | `/api/ticket?page=1&size=20&search=&status=` | Query params |
| GET | `/api/ticket/{id}` | — |
| POST | `/api/ticket` | `{ titel, beschreibung, status, prioritaet, kategorie, faelligkeitsdatum, kundeId, projektId }` |
| PUT | `/api/ticket/{id}` | Aynı body |
| DELETE | `/api/ticket/{id}` | — |
| PATCH | `/api/ticket/{id}/status?status=Geloest` | Query param |

### 💬 Ticket Nachrichten (Mesajlar)

| Metod | Endpoint | Body / Params |
|-------|----------|---------------|
| GET | `/api/ticketnachricht/ticket/{ticketId}` | — |
| POST | `/api/ticketnachricht` | `{ ticketId, inhalt, istInternNotiz }` |

### 💬 Chat

| Metod | Endpoint | Body / Params |
|-------|----------|---------------|
| GET | `/api/chat/raeume` | — |
| GET | `/api/chat/raum/{raumId}/nachrichten?page=1&size=50` | Query params |

### 📊 Dashboard

| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| GET | `/api/dashboard` | Tüm istatistikler (kundenAnzahl, projekteAnzahl, ticketsAnzahl, offeneTickets...) |

### 👤 Benutzer (Kullanıcı Yönetimi)

| Metod | Endpoint | Body / Params |
|-------|----------|---------------|
| GET | `/api/benutzer` | Tüm kullanıcılar |
| GET | `/api/benutzer/{id}` | — |
| POST | `/api/benutzer` | `{ vorname, nachname, email, rolle }` |
| PUT | `/api/benutzer/{id}` | Aynı body |
| DELETE | `/api/benutzer/{id}` | — |

### 📄 Bericht (Rapor/Dosya)

| Metod | Endpoint | Body / Params |
|-------|----------|---------------|
| GET | `/api/bericht` | Liste |
| POST | `/api/bericht` | `multipart/form-data` (dosya upload) |
| GET | `/api/bericht/{id}/download` | Dosya indir |
| DELETE | `/api/bericht/{id}` | — |

### 💳 Abonnement (Taslak)

| Metod | Endpoint | Body / Params |
|-------|----------|---------------|
| GET | `/api/abonnement` | Liste |
| GET | `/api/abonnement/{id}` | — |
| GET | `/api/abonnement/plaene` | Sabit plan listesi (AllowAnonymous) |
| POST | `/api/abonnement` | `{ plan, planName, preis, startDatum, endDatum }` |
| PUT | `/api/abonnement/{id}` | Aynı body |
| DELETE | `/api/abonnement/{id}` | — |

### 💰 Zahlung (Taslak)

| Metod | Endpoint | Body / Params |
|-------|----------|---------------|
| GET | `/api/zahlung` | Liste |
| GET | `/api/zahlung/{id}` | — |
| POST | `/api/zahlung` | `{ rechnungId, betrag, iban, hinweise }` |
| PATCH | `/api/zahlung/{id}/status?status=Abgeschlossen` | Query param |

### 🔌 SignalR Hub Bağlantıları

| Hub | URL | Metodlar |
|-----|-----|----------|
| Chat | `/hubs/chat` | `JoinRoom(raumId)`, `SendMessage(raumId, inhalt)` → dinle: `ReceiveMessage`, `UserTyping` |
| Bildirim | `/hubs/benachrichtigung` | dinle: `TicketUpdated`, `NewNotification` |

### ⚙️ Her İstekte Gerekli Header

| Header | Değer | Açıklama |
|--------|-------|----------|
| `X-Mandant-Id` | `Guid` | Tenant izolasyonu |
| Cookie | httpOnly JWT | Otomatik — `withCredentials: true` |

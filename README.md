# 🇩🇪 Vista.CoreX (Saas.CoreX) — B2B SaaS-Plattform für KMU

> **🏢 Zielgruppe & Fokus:** **Vista.CoreX ist speziell für kleine und mittlere Unternehmen (KMU)** konzipiert. Es bietet eine schlanke, kosteneffiziente und sofort einsatzbereite All-in-One-Verwaltungsplattform für den DACH-Markt.

[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![SignalR](https://img.shields.io/badge/SignalR-Realtime-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-CoreX--Demo-success?logo=github)](https://goekss.github.io/CoreX-Demo/)
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)]()

---

## 🌐 Live-Demo (GitHub Pages)

Die interaktive Demo-Version der Benutzeroberfläche kann direkt über folgenden Link aufgerufen werden:

👉 **[https://goekss.github.io/CoreX-Demo/](https://goekss.github.io/CoreX-Demo/)**

> ℹ️ **Hinweis zur Demo:** Diese Live-Demo ist für eine eigenständige Vorschau (Mock / UI-Demonstration) konfiguriert. Um alle Funktionen (2FA per E-Mail, echte SignalR-WebSockets, Datei-Uploads und PDF-Generierung) mit vollem Backend-Umfang zu nutzen, folgen Sie der lokalen Installationsanleitung.

---

## 🎯 Zweck und Funktionsumfang (Für KMU)

Kleine und mittlere Unternehmen benötigen oft keine überdimensionierten, schwerfälligen Enterprise-ERP-Systeme. **Vista.CoreX** bündelt alle täglichen Kernprozesse in einer einzigen, reaktionsschnellen Weboberfläche:

* **Mandantenfähigkeit (Multi-Tenant):** Strikte Datenisolierung über `X-Mandant-Id`-Header und JWT-Claims.
* **Kunden- & Filialverwaltung:** Kundenstamm, Niederlassungen (`Filiale`) und direkte Ansprechpartner (`Ansprechpartner`).
* **Projekt- & Aufgabenmanagement:** Zuweisung von Mitarbeitern, Meilensteinen, Statusverfolgung und Budgetierung.
* **Support-Ticket-System:** Mehrstufige Tickets, interne Notizen und vollständiger Nachrichtenverlauf.
* **Echtzeit-Kommunikation (Chat):** Integrierter Team- und Raum-Chat auf Basis von SignalR WebSockets inklusive Online-Statusanzeige.
* **Dokumenten- & Berichtswesen (Berichte):** Upload, Download, Versionierung sowie Export nach PDF und CSV.
* **Abonnement & Abrechnung:** Übersichtliche SaaS-Tarife, Nutzungslimits und Zahlungshistorie.
* **Mehrsprachigkeit (i18n):** Vollständige Unterstützung für Deutsch (DE), Englisch (EN), Französisch (FR) und Italienisch (IT).
* **Modernes Design:** Dunkel-/Hellmodus (Dark/Light Mode) und responsive Darstellung für Mobil- und Desktop-Geräte.

---

## 🔗 Backend-Integration (Vista.Core .NET Web API)

Das Frontend arbeitet nahtlos mit dem **Vista.Core** (.NET 8/9 Web API) Backend zusammen:

* **Sicherheit & Authentifizierung:** ASP.NET Core Identity + JWT (In-Memory Access Token) + HttpOnly Cookie (Refresh Token).
* **SignalR Hubs:** `ChatHub` (`/hubs/chat`) und `BenachrichtigungHub` (`/hubs/benachrichtigung`).
* **Fehlerbehandlung:** RFC 7807 Problem Details und Validierungsfehler werden standardisiert als `ApiError` verarbeitet.

### 🔄 Vergleich: Echtes Backend vs. Mock-Demo

| Feature | 🔌 Echtes Backend (`VITE_USE_MOCK=false`) | 🎭 Mock-Demo (`VITE_USE_MOCK=true`) |
|---|---|---|
| **API-Verbindung** | Lokales oder gehostetes REST API (`:8080`) | Lokale Mock-Daten im Browser |
| **Authentifizierung** | Echter E-Mail-2FA-Code & JWT | Simulierte Anmeldung |
| **Live-Chat** | SignalR WebSocket-Verbindung | Lokale Echo-Antworten |
| **Einsatzbereich** | Produktivbetrieb, Staging, End-to-End-Test | Schnelle Präsentationen, GitHub Pages |

---

## 🔐 Authentifizierungsablauf (Auth Flow)

```text
[1. Login-Formular] ──> POST /api/auth/login { email, password }
       │
       ▼ (2FA-Code wird per E-Mail gesendet)
[2. /verify Seite]  ──> POST /api/auth/verify { email, code }
       │
       ▼ (Erfolgreich)
[Access Token]      ──> Nur im Arbeitsspeicher (RAM / In-Memory) gegen XSS
[Refresh Token]     ──> HttpOnly, Secure Cookie (Browser-gesteuert)
       │
       ▼
[Geschützte Routen] ──> Header: Authorization: Bearer <token>
       │
       ▼ (Bei Token-Ablauf - 401 Unauthorized)
[Silent Refresh]    ──> POST /api/auth/refresh ──> Automatische Erneuerung
```

> 📄 Ausführliche Dokumentation: **[Doc/AuthFlow.md](file:///c:/Users/onurg/source/repos/Saas.CoreX/Doc/AuthFlow.md)**

---

## 📁 Projektstruktur (Modulare Feature-Architektur)

```text
src/
├── api/                   # REST-API-Services (axiosClient, authApi, kundeApi, benutzerApi etc.)
├── components/            # Modulare & wiederverwendbare Feature-Komponenten
│   ├── benutzer/          # 👤 Benutzer-Module (BenutzerModal, BenutzerViewModal, LockedUsersPanel)
│   ├── chat/              # 💬 Chat-Module (ChatSidebar, ChatMessageItem, ChatInput, chatUtils)
│   ├── dashboard/         # 📊 Dashboard-Widgets (StatCard, ChartCard, RecentTickets, PriorityBreakdown)
│   ├── kunden/            # 🏢 Kunden-Module (KundeModal, AnsprechpartnerModal, KundeProjekteModal)
│   ├── layout/            # 📐 App-Shell (MainLayout, Sidebar, Header, ThemeSettingsPanel)
│   └── shared/            # 🧩 Globale UI-Komponenten (ErrorBoundary, ProtectedRoute, DataTable)
├── hooks/                 # Custom React Hooks (useAuth, useLanguage, usePermission, useSignalR)
├── pages/                 # Schlanke Seiten-Controller (Dashboard, Kunden, Benutzer, Chat, NotFound)
├── styles/                # Modulare CSS-Stylesheets
├── theme.css              # Globales Design-System & CSS-Tokens
├── App.jsx                # Routing & RBAC (Role-Based Access Control)
└── main.jsx               # React-Root & ErrorBoundary-Kapselung
```

> 📄 Ausführliche Strukturübersicht: **[Doc/FileStructure.md](file:///c:/Users/onurg/source/repos/Saas.CoreX/Doc/FileStructure.md)**

---

## 🛠️ Installation und Start

```bash
# 1. Repository klonen
git clone https://github.com/Goekss/Vista.CoreX.git
cd Vista.CoreX

# 2. Abhängigkeiten installieren
npm install

# 3. Umgebungsvariablen anlegen
cp .env.example .env

# 4. Entwicklungsserver starten
npm run dev
```

Der Server ist standardmäßig unter `http://localhost:5173` erreichbar.

---

## 🛡️ Sicherheit & Fehlerbehandlung

* **Global Error Boundary:** [ErrorBoundary.jsx](file:///c:/Users/onurg/source/repos/Saas.CoreX/src/components/shared/ErrorBoundary.jsx) fängt unerwartete Rendering-Fehler ab und verhindert weiße Bildschirme.
* **404-Seite:** Benutzerfreundliche Seite [NotFound.jsx](file:///c:/Users/onurg/source/repos/Saas.CoreX/src/pages/NotFound.jsx) für nicht existierende Routen.
* **OWASP Token-Sicherheit:** Access Token werden niemals im `localStorage` gespeichert; sie verbleiben im RAM mit HttpOnly Silent Refresh.
* **Bereinigte Logs:** Produktionsrelevante Logs enthalten keine sensiblen Benutzer- oder Token-Daten.

---

# 🇹🇷 Vista.CoreX (Saas.CoreX) — KOBİ'ler İçin Kurumsal SaaS Platformu

> **🏢 Hedef Kitle & Odak:** **Aslında bu proje, özellikle Küçük ve Orta Ölçekli Şirketler (KOBİ / KMU) için uygundur.** Ağır ve maliyetli kurumsal ERP sistemlerinin karmaşasından uzak; hızlı, modern ve hepsi-bir-arada bir yönetim altyapısı sunar.

[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![SignalR](https://img.shields.io/badge/SignalR-Realtime-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-CoreX--Demo-success?logo=github)](https://goekss.github.io/CoreX-Demo/)
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)]()

---

## 🌐 Canlı Demo (Live Demo)

Uygulamanın statik GitHub Pages demosunu aşağıdaki bağlantıdan anında inceleyebilirsiniz:

👉 **[https://goekss.github.io/CoreX-Demo/](https://goekss.github.io/CoreX-Demo/)**

> ℹ️ **Demo Bilgisi:** Canlı demo ortamı bağımsız arayüz önizlemesi (mock / demo) için yapılandırılmıştır. Gerçek backend entegrasyonu ile tüm özellikleri (2FA e-posta onayı, gerçek zamanlı SignalR chat, rapor indirme ve logo yükleme) test etmek için yerel kurulum adımlarını takip ediniz.

---

## 🎯 Proje Amacı ve Kapsamı (KOBİ Odaklı)

Küçük ve orta ölçekli işletmelerin dijitalleşme sürecinde ihtiyaç duyduğu tüm operasyonel fonksiyonlar tek çatı altında toplanmıştır:

* **Çok Kiracılı (Multi-Tenant) Mimari:** `X-Mandant-Id` başlığı ve JWT tabanlı tam kiracı izolasyonu.
* **Müşteri & Şube Yönetimi:** Müşteri portföyü, bağlı şubeler (`Filiale`) ve yetkili iletişim kişileri (`Ansprechpartner`).
* **Proje & Görev Takibi:** Personele atanan projeler, aşamalar, durum güncellemeleri ve teslim takibi.
* **Destek & Bildirim Sistemi (Ticket):** Çok seviyeli destek talepleri, mesajlaşma geçmişi ve iç notlar.
* **Gerçek Zamanlı İletişim (Chat):** SignalR WebSocket altyapısı ile online/offline durumları, genel ve oda bazlı anlık mesajlaşma.
* **Belge & Raporlama (Berichte):** PDF ve CSV dışa aktarımı, belge versiyonlama ve güvenli dosya transferi.
* **SaaS Abonelik & Ödeme:** Paketler, kotalar, abonelik durumları ve ödeme hareketleri.
* **Çok Dilli Altyapı (i18n):** Almanca (DE), İngilizce (EN), Fransızca (FR) ve İtalyanca (IT) tam dil desteği.
* **Karanlık/Aydınlık Tema:** Modern, göz yormayan ve mobil uyumlu CSS değişkenleri tabanlı tema motoru.

---

## 🔗 Backend ile İlişki (Vista.Core .NET API)

Vista.CoreX ön yüzü, **Vista.Core** (.NET 8/9 Web API) backend servisiyle tam entegre çalışacak şekilde tasarlanmıştır:

* **Kimlik Doğrulama:** ASP.NET Core Identity + JWT (Access Token) + HttpOnly Cookie (Refresh Token).
* **Gerçek Zamanlı Hub'lar:** `ChatHub` (`/hubs/chat`) ve `BenachrichtigungHub` (`/hubs/benachrichtigung`).
* **Tenant Ayrımı:** Her istekte çözümlenen kiracı ID'si (`X-Mandant-Id`) backend DbContext filtrelerine otomatik iletilir.
* **Hata Yönetimi:** Backend Problem Details veya Validation formatındaki hatalar standart `ApiError` nesnelerine dönüştürülür.

### 🔄 Gerçek Backend vs. Mock Demo Ayrımı

| Özellik | 🔌 Gerçek Backend Modu (`VITE_USE_MOCK=false`) | 🎭 Mock Demo Modu (`VITE_USE_MOCK=true`) |
|---|---|---|
| **API İletişimi** | `http://localhost:8080/api` veya uzak sunucu | Tarayıcı içi statik mock veriler |
| **Oturum & 2FA** | Gerçek e-posta doğrulama kodu ve JWT token | Simüle edilmiş hızlı giriş |
| **Canlı Chat** | SignalR WebSocket bağlantısı | Simüle edilmiş otomatik mesajlar |
| **Kullanım Alanı** | Geliştirme, Entegrasyon, Canlı Üretim | GitHub Pages, UI/UX sunumları, hızlı test |

---

## 🔐 Kimlik Doğrulama Akışı (Auth Flow)

```text
[Kullanıcı Girişi] ──> POST /api/auth/login
       │
       ▼ (2FA Kodu E-postaya Gönderilir)
[/verify Sayfası] ──> POST /api/auth/verify { email, code }
       │
       ▼ (Başarılı)
[JWT Access Token] ──> RAM (In-Memory) Saklanır (XSS Koruması)
[Refresh Token]    ──> HttpOnly, Secure Cookie (Tarayıcı Yönetir)
       │
       ▼
[Korumalı Rotalar] ──> Header: Authorization: Bearer <token>
       │
       ▼ (Token Süresi Dolduğunda - 401)
[Silent Refresh]   ──> POST /api/auth/refresh ──> Otomatik Token Yenileme
```

> 📄 Detaylı akış şeması, yetkilendirme rolleri (RBAC) ve güvenlik mimarisi için: **[Doc/AuthFlow.md](file:///c:/Users/onurg/source/repos/Saas.CoreX/Doc/AuthFlow.md)**

---

## 📁 Proje Dosya Yapısı (Modüler Feature Mimarisi)

```text
src/
├── api/                   # Backend REST API entegrasyon servisleri (axiosClient, authApi, kundeApi...)
├── components/            # Modüler & Yeniden kullanılabilir Feature bileşenleri
│   ├── benutzer/          # 👤 Personel modülleri (BenutzerModal, BenutzerViewModal, LockedUsersPanel)
│   ├── chat/              # 💬 Canlı mesajlaşma (ChatSidebar, ChatMessageItem, ChatInput, chatUtils)
│   ├── dashboard/         # 📊 Dashboard widget'ları (StatCard, ChartCard, RecentTickets, PriorityBreakdown)
│   ├── kunden/            # 🏢 Müşteri modülleri (KundeModal, AnsprechpartnerModal, KundeProjekteModal)
│   ├── layout/            # 📐 Sayfa iskeleti (MainLayout, Sidebar, Header, ThemeSettingsPanel)
│   └── shared/            # 🧩 Ortak bileşenler (ErrorBoundary, ProtectedRoute, DataTable, LoadingSpinner)
├── hooks/                 # Özel React kancaları (useAuth, useLanguage, usePermission, useSignalR)
├── pages/                 # İnce Sayfa Denetleyicileri (Dashboard, Kunden, Benutzer, Chat, NotFound vb.)
├── styles/                # Modüler CSS stil dosyaları
├── theme.css              # Global CSS değişkenleri ve tema sistemi
├── App.jsx                # Rota yönetimi ve rol bazlı erişim denetimi (RBAC)
└── main.jsx               # Kök React montajı ve ErrorBoundary koruması
```

> 📄 Tüm dosya ve modüllerin detaylı açıklamaları için: **[Doc/FileStructure.md](file:///c:/Users/onurg/source/repos/Saas.CoreX/Doc/FileStructure.md)**

---

## 🛠️ Kurulum ve Çalıştırma (Setup / Run)

### 1. Gereksinimler
* **Node.js**: v18.0.0 veya üzeri
* **npm**: v9.0.0 veya üzeri
* (Opsiyonel) Çalışan bir **Vista.Core Backend API** servisi (`http://localhost:8080`)

### 2. Kurulum Adımları

```bash
# 1. Depoyu klonlayın
git clone https://github.com/Goekss/Vista.CoreX.git
cd Vista.CoreX

# 2. Bağımlılıkları yükleyin
npm install

# 3. Ortam değişkenlerini hazırlayın
cp .env.example .env

# 4. Geliştirme Sunucusunu Başlatma
npm run dev
```

Uygulama varsayılan olarak `http://localhost:5173` adresinde çalışacaktır.

### 3. Production Derlemesi

```bash
npm run build
npm run preview
```

---

## 🛡️ Güvenlik ve Hata Yönetimi

* **Global Error Boundary:** [ErrorBoundary.jsx](file:///c:/Users/onurg/source/repos/Saas.CoreX/src/components/shared/ErrorBoundary.jsx) bileşeni sayesinde render zamanı hatalarında uygulamanın beyaz ekranda kalması (*WSOD*) engellenir, kullanıcıya kurtarma butonları sunulur.
* **404 Sayfası:** Tanımsız veya yetkisiz rotalar için kullanıcı dostu [NotFound.jsx](file:///c:/Users/onurg/source/repos/Saas.CoreX/src/pages/NotFound.jsx) sayfası devrededir.
* **OWASP Token Güvenliği:** Access token `localStorage` üzerinde depolanmaz; RAM'de tutulur ve HttpOnly cookie tabanlı silent refresh mekanizması işletilir.
* **Temiz Log Standardı:** Canlı kodda kullanıcı bilgileri, e-posta veya JWT token logları bulunmaz; geliştirici hataları sadece dev modunda şartlı olarak konsola basılır.

---

# 🇬🇧 Vista.CoreX (Saas.CoreX) — Enterprise SaaS Platform for SMEs

> **🏢 Target Audience & Focus:** **Vista.CoreX is specifically designed for Small and Medium-sized Enterprises (SMEs / KMU).** It provides an agile, modern, and cost-effective all-in-one management platform without the complexity and overhead of bulky legacy ERP systems.

[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![SignalR](https://img.shields.io/badge/SignalR-Realtime-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-CoreX--Demo-success?logo=github)](https://goekss.github.io/CoreX-Demo/)
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)]()

---

## 🌐 Live Demo (GitHub Pages)

Experience the interactive frontend live demo directly at the following link:

👉 **[https://goekss.github.io/CoreX-Demo/](https://goekss.github.io/CoreX-Demo/)**

> ℹ️ **Demo Notice:** This live demo is configured for standalone interface preview (mock data). To test complete end-to-end features (2FA email delivery, real SignalR WebSockets, report generation, and file uploads), follow the local setup instructions below.

---

## 🎯 Purpose and Core Features (SME Focused)

Small and medium-sized enterprises need streamlined, automated operations. **Vista.CoreX** consolidates essential business workflows into a unified, responsive web interface:

* **Multi-Tenant Architecture:** Strict tenant isolation via `X-Mandant-Id` header and validated JWT claims.
* **Customer & Branch Management:** Client database, company branches (`Filiale`), and dedicated contacts (`Ansprechpartner`).
* **Project & Task Tracking:** Personnel assignment, progress milestones, status tracking, and budget control.
* **Support Ticket System:** Multi-tiered ticket ticketing, internal notes, and complete message histories.
* **Real-Time Communication (Chat):** Team and room chat powered by SignalR WebSockets with real-time online status tracking.
* **Documents & Reporting (Berichte):** PDF and CSV export, secure file uploads/downloads, and document versioning.
* **Subscriptions & Billing:** Transparent SaaS tier plans, usage quotas, and payment history.
* **Multi-Language Support (i18n):** Native support for German (DE), English (EN), French (FR), and Italian (IT).
* **Modern Design Engine:** Light and dark theme toggle with CSS custom properties, fully mobile responsive.

---

## 🔗 Backend Relationship (Vista.Core .NET Web API)

The frontend is architected to seamlessly pair with the **Vista.Core** (.NET 8/9 Web API) backend:

* **Authentication:** ASP.NET Core Identity + JWT (In-Memory Access Token) + HttpOnly Cookie (Refresh Token).
* **SignalR Hubs:** `ChatHub` (`/hubs/chat`) and `BenachrichtigungHub` (`/hubs/benachrichtigung`).
* **Multi-Tenancy:** The tenant ID (`X-Mandant-Id`) is dynamically resolved and forwarded to backend DbContext global query filters.
* **Standardized Error Handling:** RFC 7807 Problem Details and model validation errors are translated into localized `ApiError` instances.

### 🔄 Comparison: Real Backend vs. Mock Demo

| Feature | 🔌 Real Backend Mode (`VITE_USE_MOCK=false`) | 🎭 Mock Demo Mode (`VITE_USE_MOCK=true`) |
|---|---|---|
| **API Connection** | Local or remote REST API (`:8080`) | In-browser mock data stores |
| **Authentication** | Real email 2FA verification & JWT | Simulated instant login |
| **Realtime Chat** | Live SignalR WebSocket connections | Simulated local bot responses |
| **Use Case** | Production, Staging, Full Integration Testing | GitHub Pages showcase, UI/UX demo |

---

## 🔐 Authentication & Security Flow (Auth Flow)

```text
[1. User Login]     ──> POST /api/auth/login { email, password }
       │
       ▼ (2FA Code Dispatched via Email)
[2. /verify Screen] ──> POST /api/auth/verify { email, code }
       │
       ▼ (Success)
[Access Token]      ──> Stored strictly In-Memory (RAM) to prevent XSS
[Refresh Token]     ──> HttpOnly, Secure Cookie managed by the browser
       │
       ▼
[Protected Routes]  ──> Header: Authorization: Bearer <token>
       │
       ▼ (Upon Token Expiry - 401 Unauthorized)
[Silent Refresh]    ──> POST /api/auth/refresh ──> Automatic Token Renewal
```

> 📄 Detailed sequence diagram and RBAC architecture: **[Doc/AuthFlow.md](file:///c:/Users/onurg/source/repos/Saas.CoreX/Doc/AuthFlow.md)**

---

## 📁 Project Directory Structure (Modular Feature Architecture)

```text
src/
├── api/                   # REST API integration services (axiosClient, authApi, kundeApi, etc.)
├── components/            # Modular & reusable feature components
│   ├── benutzer/          # 👤 User management (BenutzerModal, BenutzerViewModal, LockedUsersPanel)
│   ├── chat/              # 💬 Real-time chat (ChatSidebar, ChatMessageItem, ChatInput, chatUtils)
│   ├── dashboard/         # 📊 Dashboard widgets (StatCard, ChartCard, RecentTickets, PriorityBreakdown)
│   ├── kunden/            # 🏢 Customer modules (KundeModal, AnsprechpartnerModal, KundeProjekteModal)
│   ├── layout/            # 📐 App shell (MainLayout, Sidebar, Header, ThemeSettingsPanel)
│   └── shared/            # 🧩 Global shared UI (ErrorBoundary, ProtectedRoute, DataTable, LoadingSpinner)
├── hooks/                 # Custom React hooks (useAuth, useLanguage, usePermission, useSignalR)
├── pages/                 # Lean page controllers (Dashboard, Kunden, Benutzer, Chat, NotFound)
├── styles/                # Modular stylesheet definitions
├── theme.css              # Global CSS variables & design tokens
├── App.jsx                # Routing layout & RBAC (Role-Based Access Control)
└── main.jsx               # React bootstrap & ErrorBoundary wrapper
```

> 📄 Full architecture blueprint: **[Doc/FileStructure.md](file:///c:/Users/onurg/source/repos/Saas.CoreX/Doc/FileStructure.md)**

---

## 🛠️ Setup and Installation

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* (Optional) Running instance of **Vista.Core Backend API** (`http://localhost:8080`)

### 2. Quickstart Steps

```bash
# 1. Clone repository
git clone https://github.com/Goekss/Vista.CoreX.git
cd Vista.CoreX

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Start local development server
npm run dev
```

Application will run locally at `http://localhost:5173`.

### 3. Production Build

```bash
npm run build
npm run preview
```

---

## 🛡️ Security & Reliability

* **Global Error Boundary:** [ErrorBoundary.jsx](file:///c:/Users/onurg/source/repos/Saas.CoreX/src/components/shared/ErrorBoundary.jsx) traps uncaught render errors and prevents white screens of death (*WSOD*), providing instant reload and reset controls.
* **404 Route Protection:** Dedicated and stylized [NotFound.jsx](file:///c:/Users/onurg/source/repos/Saas.CoreX/src/pages/NotFound.jsx) page handles wildcards and unauthorized navigations.
* **OWASP Token Hardening:** Access tokens are stored exclusively in-memory, mitigating XSS exfiltration risks in accordance with modern web standards.
* **Sanitized Logs:** Production builds omit sensitive user payloads, email addresses, and JWT tokens.

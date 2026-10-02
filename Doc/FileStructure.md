# 📁 Vista.CoreX — Proje Dosya ve Mimari Yapısı

Bu doküman, Vista.CoreX Frontend projesinin dizin hiyerarşisini, katmanlarını ve bileşen sorumluluklarını açıklamaktadır.

---

## 1. Dizin Ağacı Şeması

```text
Saas.CoreX/
├── index.html                 # Ana HTML giriş şablonu
├── vite.config.js             # Vite derleyici ve eklenti yapılandırması
├── package.json               # Bağımlılıklar ve npm betikleri
├── .env.example               # Örnek ortam değişkenleri şablonu
├── Rutush.md                  # Senior & AI geliştirme takip listesi
├── Doc/                       # Kurumsal mimari ve entegrasyon dokümantasyonu
│   ├── AuthFlow.md            # Authentication, 2FA ve RBAC akış dokümanı
│   ├── FileStructure.md       # Dosya yapısı ve mimari rehberi
│   ├── Frontend_integration_guide.md
│   └── sonkontrol.md
└── src/
    ├── main.jsx               # React kök montaj noktası (Providers & ErrorBoundary)
    ├── App.jsx                # Rota tanımları (React Router) ve korumalı rotalar
    ├── theme.css              # Global CSS değişkenleri, renk paletleri ve tema motoru
    ├── mobile.css             # Mobil ve duyarlı (responsive) tasarım kuralları
    │
    ├── api/                   # Backend REST API entegrasyon katmanı
    │   ├── axiosClient.js     # Merkezi Axios örneği (In-memory token, interceptors, 401 refresh)
    │   ├── errorHandler.js    # API hata standardizasyonu ve i18n hata çevirici
    │   ├── authApi.js         # Kimlik doğrulama, 2FA, me, unlock istekleri
    │   ├── kundeApi.js        # Müşteri (Kunde) CRUD ve logo upload işlemleri
    │   ├── ansprechpartnerApi.js # İletişim kişileri API istekleri
    │   ├── projektApi.js      # Proje yönetimi ve personel atama istekleri
    │   ├── ticketApi.js       # Destek talepleri ve mesajlaşma API istekleri
    │   ├── benutzerApi.js     # Kullanıcı yönetimi, rol atama ve avatar işlemleri
    │   ├── berichtApi.js      # Dosya yükleme/indirme ve raporlama istekleri
    │   ├── filialeApi.js      # Şube yönetimi API istekleri
    │   ├── abonnementApi.js   # SaaS abonelik ve plan yönetimi istekleri
    │   ├── zahlungApi.js      # Ödeme ve finansal hareket istekleri
    │   ├── dashboardApi.js    # İstatistik ve KPI veri istekleri
    │   └── chatApi.js         # Chat odaları ve mesaj geçmişi API istekleri
    │
    ├── components/            # Modüler ve yeniden kullanılabilir UI bileşenleri
    │   ├── kunden/            # 🏢 Müşteri özellikleri (KundeModal, AnsprechpartnerModal, KundeProjekteModal)
    │   ├── benutzer/          # 👤 Personel özellikleri (BenutzerModal, BenutzerViewModal, LockedUsersPanel)
    │   ├── dashboard/         # 📊 Dashboard bileşenleri (StatCard, ChartCard, RecentTickets, PriorityBreakdown)
    │   ├── chat/              # 💬 Canlı sohbet bileşenleri (ChatSidebar, ChatMessageItem, ChatInput, chatUtils)
    │   ├── layout/            # 📐 Sayfa iskeleti ve navigasyon bileşenleri
    │   │   ├── MainLayout.jsx # Ana çerçeve (Sidebar + Header + Content)
    │   │   ├── Header.jsx     # Üst bar (Kullanıcı profili, dil seçici, tema düğmesi)
    │   │   ├── Sidebar.jsx    # Sol ana menü navigasyonu ve rol bazlı linkler
    │   │   └── ThemeSettingsPanel.jsx # Tema ve renk paleti ayar paneli
    │   │
    │   └── shared/            # 🧩 Ortak kullanılan atomik bileşenler
    │       ├── ErrorBoundary.jsx  # Global React hata yakalayıcı (Fallback UI)
    │       ├── ProtectedRoute.jsx # Oturum ve rol kontrolü sağlayan rota koruyucu
    │       ├── DataTable.jsx      # Sayfalama, sıralama ve arama destekli tablo
    │       ├── LoadingSpinner.jsx # Yükleniyor göstergesi
    │       ├── ConfirmDialog.jsx  # İşlem onay (Delete/Save vb.) modali
    │       ├── StatusBadge.jsx    # Durum etiketleri (Aktif, Pasif, Beklemede vb.)
    │       └── VikaChat/          # Akıllı asistan / RAG chat widget bileşeni
    │
    ├── hooks/                 # Özel React Hook'ları ve Context Provider'ları
    │   ├── useAuth.jsx        # Kullanıcı oturumu, login/logout, JWT Context
    │   ├── useLanguage.jsx    # Çoklu dil (DE, EN, FR, IT) i18n Context
    │   ├── usePermission.js   # Kullanıcı rolü ve aksiyon bazlı yetki kontrolü
    │   ├── useSignalR.js      # Gerçek zamanlı WebSocket (Chat & Bildirim) bağlantısı
    │   └── useVikaChat.js     # ViKa AI asistan durum ve mesajlaşma hook'u
    │
    ├── pages/                 # Rota bazlı tam ekran sayfa bileşenleri
    │   ├── Login.jsx          # E-posta & parola giriş ekranı
    │   ├── ZweiFaktor.jsx     # İki aşamalı doğrulama (2FA) kod giriş ekranı
    │   ├── Dashboard.jsx      # KPI kartları, son aktiviteler ve grafikler
    │   ├── Kunden.jsx         # Müşteri listesi, detayları ve iletişim kişileri
    │   ├── Projekte.jsx       # Proje takibi, durumları ve personel atamaları
    │   ├── Tickets.jsx        # Destek bildirimleri ve mesajlaşma geçmişi
    │   ├── Chat.jsx           # Gerçek zamanlı ekip içi mesajlaşma (SignalR)
    │   ├── Benutzer.jsx       # Kullanıcı ve personel yönetim ekranı (Admin)
    │   ├── Berichte.jsx       # Belge ve rapor yükleme / indirme arayüzü
    │   ├── Filiale.jsx        # Şube yönetim arayüzü
    │   ├── Abonnement.jsx     # SaaS abonelik paketleri ve plan yönetimi
    │   ├── Zahlung.jsx        # Ödeme takibi ve faturalandırma
    │   └── NotFound.jsx       # 404 Bulunamadı sayfası
    │
    └── styles/                # Sayfaya özel CSS stilleri
        ├── Kunden.css
        ├── Chat.css
        ├── Dashboard.css
        └── VikaChat.css
```

---

## 2. Temel Akış ve Katmanlar Arası İlişki

1. **Giriş Noktası (`main.jsx`):**
   - Uygulama `ErrorBoundary` ile sarılır.
   - `BrowserRouter` → `LanguageProvider` → `AuthProvider` katmanları ile küresel durum (state) başlatılır.
2. **Yönlendirme (`App.jsx`):**
   - Açık rotalar (`/login`, `/verify`), korumalı rotalar (`ProtectedRoute` altındaki modüller) ve bilinmeyen rotalar (`NotFound`) yönetilir.
3. **Veri İletişimi (`api/` & `hooks/`):**
   - Sayfa bileşenleri doğrudan fetch/axios çağırmaz; `src/api/*` modüllerini kullanır.
   - Token ve yetkiler merkezi `axiosClient.js` üzerinden otomatik olarak enjekte edilir.
